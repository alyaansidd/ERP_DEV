import Attendance from '../models/Attendance.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Student from '../models/Student.js';
import {
  extractFacultyAssignments,
  getFacultyScope,
  isFacultyAssignedToClassSubject
} from '../utils/facultyScope.js';
import { getScopedDepartmentId } from '../utils/hodScope.js';

/** Consistent populate for Attendance queries with nested student records */
const populateAttendance = (query) =>
  query
    .populate('classId', 'name roomNo departmentId')
    .populate('subjectId', 'subjectCode name credit')
    .populate({
      path: 'record',
      populate: {
        path: 'studentId',
        select: 'rollNo userId departmentId',
        populate: { path: 'userId', select: 'name email phoneNo' }
      }
    });

const normalizeAttendanceDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const findStudentForUser = (userId) => Student.findOne({ userId }).select('_id classId');

const limitAttendanceToStudent = (attendanceDoc, studentId) => {
  if (!attendanceDoc) return attendanceDoc;
  const record = Array.isArray(attendanceDoc.record) ? attendanceDoc.record : [];
  const ownRecord = record.filter((entry) => String(entry.studentId?._id || entry.studentId) === String(studentId));
  return {
    ...attendanceDoc.toObject(),
    record: ownRecord
  };
};

/**
 * Get all attendance records
 * @route GET /api/attendance
 */
export const getAllAttendance = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const student = await findStudentForUser(req.user.id);
      if (!student) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }

      const attendance = await populateAttendance(
        Attendance.find({
          classId: student.classId,
          'record.studentId': student._id
        })
      );

      const ownAttendance = attendance.map((doc) => limitAttendanceToStudent(doc, student._id));

      return res.status(200).json({
        success: true,
        count: ownAttendance.length,
        data: ownAttendance
      });
    }

    const facultyScope = await getFacultyScope(req);
    const scopedDepartmentId = await getScopedDepartmentId(req);

    let filter = {};
    if (facultyScope) {
      const assignedPairs = extractFacultyAssignments(facultyScope.routing)
        .filter(({ subjectId }) => Boolean(subjectId))
        .map(({ classId, subjectId }) => ({ classId, subjectId }));

      filter = assignedPairs.length > 0
        ? {
            $or: assignedPairs.map(({ classId, subjectId }) => ({
              classId,
              subjectId
            }))
          }
        : { _id: null };
    } else if (scopedDepartmentId) {
      const classes = await Class.find({ departmentId: scopedDepartmentId }).select('_id');
      const classIds = classes.map((doc) => doc._id);
      filter = classIds.length > 0 ? { classId: { $in: classIds } } : { _id: null };
    }

    const attendance = await populateAttendance(Attendance.find(filter));

    return res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error('Get attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving attendance records'
    });
  }
};

/**
 * Get attendance by ID
 * @route GET /api/attendance/:id
 */
export const getAttendanceById = async (req, res) => {
  try {
    const attendance = await populateAttendance(Attendance.findById(req.params.id));

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    if (req.user.role === 'student') {
      const student = await findStudentForUser(req.user.id);
      const ownRecord = attendance.record?.some(
        (entry) => String(entry.studentId?._id || entry.studentId) === String(student?._id)
      );

      if (!student || !ownRecord) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Students can only access their own attendance'
        });
      }

      return res.status(200).json({
        success: true,
        data: limitAttendanceToStudent(attendance, student._id)
      });
    }

    const facultyScope = await getFacultyScope(req);
    if (facultyScope && !isFacultyAssignedToClassSubject(facultyScope, attendance.classId?._id || attendance.classId, attendance.subjectId?._id || attendance.subjectId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Faculty can only access attendance for their assigned classes and subjects'
      });
    }

    const scopedDepartmentId = await getScopedDepartmentId(req);
    const attendanceDepartmentId = attendance.classId?.departmentId ? String(attendance.classId.departmentId) : null;
    if (scopedDepartmentId && attendanceDepartmentId !== scopedDepartmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only access attendance from their assigned department'
      });
    }

    return res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error('Get attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving attendance record'
    });
  }
};

/**
 * Create new attendance record
 * @route POST /api/attendance
 */
export const createAttendance = async (req, res) => {
  try {
    const { classId, subjectId, lectureNo, date, record } = req.body;
    const normalizedDate = normalizeAttendanceDate(date);

    if (!classId || !subjectId || !lectureNo || !date || !normalizedDate || !record || !Array.isArray(record) || record.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide classId, subjectId, lectureNo, date, and record array with student attendance'
      });
    }

    const facultyScope = await getFacultyScope(req);

    // Validate class exists
    const classDoc = await Class.findById(classId).select('departmentId studentIds');
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (facultyScope && !isFacultyAssignedToClassSubject(facultyScope, classId, subjectId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Faculty can only take attendance for their assigned classes and routed subjects'
      });
    }

    const scopedDepartmentId = await getScopedDepartmentId(req);
    if (scopedDepartmentId && String(classDoc.departmentId) !== scopedDepartmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only create attendance for classes in their assigned department'
      });
    }

    // Validate subject exists
    const subjectDoc = await Subject.findById(subjectId);
    if (!subjectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Validate all students exist and validate status
    const studentIds = record.map((r) => r.studentId);
    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
      return res.status(404).json({
        success: false,
        message: 'Some students not found'
      });
    }

    const invalidDepartmentStudent = students.find((student) => String(student.departmentId) !== String(classDoc.departmentId));
    if (invalidDepartmentStudent) {
      return res.status(400).json({
        success: false,
        message: 'All attendance students must belong to the class department'
      });
    }

    const classStudentIds = new Set((classDoc.studentIds || []).map((studentId) => String(studentId)));
    const invalidClassStudent = studentIds.find((studentId) => !classStudentIds.has(String(studentId)));
    if (invalidClassStudent) {
      return res.status(400).json({
        success: false,
        message: 'All attendance students must be enrolled in the selected class'
      });
    }

    // Validate status values
    const validStatuses = record.every((r) => ['P', 'A'].includes(r.status));
    if (!validStatuses) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be "P" (Present) or "A" (Absent)'
      });
    }

    const existingAttendance = await Attendance.findOne({
      classId,
      subjectId,
      lectureNo,
      date: normalizedDate
    }).select('_id');
    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message: 'Attendance record for this class, subject, lecture, and date already exists'
      });
    }

    const attendance = await Attendance.create({
      classId,
      subjectId,
      lectureNo,
      date: normalizedDate,
      record
    });

    const populated = await populateAttendance(Attendance.findById(attendance._id));

    return res.status(201).json({
      success: true,
      message: 'Attendance record created successfully',
      data: populated
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error('Create attendance error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', ')
      });
    }
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Attendance record for this class, subject, lecture, and date already exists'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error creating attendance record'
    });
  }
};

/**
 * Update attendance
 * @route PUT /api/attendance/:id
 */
export const updateAttendance = async (req, res) => {
  try {
    const existingAttendance = await Attendance.findById(req.params.id);
    if (!existingAttendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const facultyScope = await getFacultyScope(req);
    const scopedDepartmentId = await getScopedDepartmentId(req);
    const existingClass = await Class.findById(existingAttendance.classId).select('departmentId studentIds');
    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: 'Linked class not found for this attendance record'
      });
    }

    const targetSubjectId = req.body.subjectId || existingAttendance.subjectId;
    const targetLectureNo = req.body.lectureNo || existingAttendance.lectureNo;
    const targetDate = Object.prototype.hasOwnProperty.call(req.body, 'date')
      ? normalizeAttendanceDate(req.body.date)
      : existingAttendance.date;

    if (Object.prototype.hasOwnProperty.call(req.body, 'date') && !targetDate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance date'
      });
    }

    if (
      facultyScope &&
      (
        !isFacultyAssignedToClassSubject(facultyScope, existingAttendance.classId, existingAttendance.subjectId) ||
        !isFacultyAssignedToClassSubject(facultyScope, req.body.classId || existingAttendance.classId, targetSubjectId)
      )
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Faculty can only update attendance for their assigned classes and routed subjects'
      });
    }

    if (scopedDepartmentId && String(existingClass.departmentId) !== scopedDepartmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only update attendance from their assigned department'
      });
    }

    const targetClassId = req.body.classId || existingAttendance.classId;
    const targetClass = await Class.findById(targetClassId).select('departmentId studentIds');
    if (!targetClass) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (scopedDepartmentId && String(targetClass.departmentId) !== scopedDepartmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only assign attendance to classes in their assigned department'
      });
    }

    // If record is being updated, validate students and statuses
    const { record } = req.body;
    if (record && Array.isArray(record) && record.length > 0) {
      const studentIds = record.map((r) => r.studentId);
      const students = await Student.find({ _id: { $in: studentIds } });
      if (students.length !== studentIds.length) {
        return res.status(404).json({
          success: false,
          message: 'Some students not found'
        });
      }

      const invalidDepartmentStudent = students.find((student) => String(student.departmentId) !== String(targetClass.departmentId));
      if (invalidDepartmentStudent) {
        return res.status(400).json({
          success: false,
          message: 'All attendance students must belong to the class department'
        });
      }

      const targetClassStudentIds = new Set((targetClass.studentIds || []).map((studentId) => String(studentId)));
      const invalidClassStudent = studentIds.find((studentId) => !targetClassStudentIds.has(String(studentId)));
      if (invalidClassStudent) {
        return res.status(400).json({
          success: false,
          message: 'All attendance students must be enrolled in the selected class'
        });
      }

      const validStatuses = record.every((r) => ['P', 'A'].includes(r.status));
      if (!validStatuses) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value. Must be "P" (Present) or "A" (Absent)'
        });
      }
    }

    const duplicateAttendance = await Attendance.findOne({
      _id: { $ne: existingAttendance._id },
      classId: targetClassId,
      subjectId: targetSubjectId,
      lectureNo: targetLectureNo,
      date: targetDate
    }).select('_id');
    if (duplicateAttendance) {
      return res.status(409).json({
        success: false,
        message: 'Attendance record for this class, subject, lecture, and date already exists'
      });
    }

    const updatePayload = {
      ...req.body,
      ...(Object.prototype.hasOwnProperty.call(req.body, 'date') ? { date: targetDate } : {})
    };

    const attendance = await populateAttendance(
      Attendance.findByIdAndUpdate(req.params.id, updatePayload, {
        new: true,
        runValidators: true
      })
    );

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      data: attendance
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error('Update attendance error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', ')
      });
    }
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Attendance record for this class, subject, lecture, and date already exists'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error updating attendance record'
    });
  }
};

/**
 * Delete attendance
 * @route DELETE /api/attendance/:id
 */
export const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const classDoc = await Class.findById(attendance.classId).select('departmentId');
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Linked class not found for this attendance record'
      });
    }

    const scopedDepartmentId = await getScopedDepartmentId(req);
    if (scopedDepartmentId && String(classDoc.departmentId) !== scopedDepartmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only delete attendance from their assigned department'
      });
    }

    await Attendance.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error('Delete attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting attendance record'
    });
  }
};
