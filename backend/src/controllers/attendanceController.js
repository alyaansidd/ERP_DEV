import Attendance from '../models/Attendance.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Student from '../models/Student.js';

/** Consistent populate for Attendance queries with nested student records */
const populateAttendance = (query) =>
  query
    .populate('classId', 'name roomNo')
    .populate('subjectId', 'subjectCode name credit')
    .populate({
      path: 'record',
      populate: {
        path: 'studentId',
        select: 'rollNo userId',
        populate: { path: 'userId', select: 'name email phoneNo' }
      }
    });

/**
 * Get all attendance records
 * @route GET /api/attendance
 */
export const getAllAttendance = async (req, res) => {
  try {
    const attendance = await populateAttendance(Attendance.find());

    return res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
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

    return res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
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
    const { classId, subjectId, date, record } = req.body;

    if (!classId || !subjectId || !date || !record || !Array.isArray(record) || record.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide classId, subjectId, date, and record array with student attendance'
      });
    }

    // Validate class exists
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
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

    // Validate status values
    const validStatuses = record.every((r) => ['P', 'A'].includes(r.status));
    if (!validStatuses) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be "P" (Present) or "A" (Absent)'
      });
    }

    const attendance = await Attendance.create({
      classId,
      subjectId,
      date,
      record
    });

    const populated = await populateAttendance(Attendance.findById(attendance._id));

    return res.status(201).json({
      success: true,
      message: 'Attendance record created successfully',
      data: populated
    });
  } catch (error) {
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
        message: 'Attendance record for this class, subject, and date already exists'
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
    const { record } = req.body;

    // If record is being updated, validate students and statuses
    if (record && Array.isArray(record) && record.length > 0) {
      const studentIds = record.map((r) => r.studentId);
      const students = await Student.find({ _id: { $in: studentIds } });
      if (students.length !== studentIds.length) {
        return res.status(404).json({
          success: false,
          message: 'Some students not found'
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

    const attendance = await populateAttendance(
      Attendance.findByIdAndUpdate(req.params.id, req.body, {
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
        message: 'Attendance record for this class, subject, and date already exists'
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
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    console.error('Delete attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting attendance record'
    });
  }
};
