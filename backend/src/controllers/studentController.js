import Student from '../models/Student.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import { getScopedDepartmentId, isDepartmentAllowedForHod } from '../utils/hodScope.js';

const USER_FIELDS = ['name', 'email', 'password', 'phoneNo', 'aadharNo', 'dob', 'role'];
const STUDENT_FIELDS = ['rollNo', 'classId', 'departmentId', 'program', 'fatherName', 'fatherNo'];

/**
 * Populate helper - reuses the same populate chain everywhere.
 */
const populateStudent = (query) =>
  query
    .populate('userId', 'name email phoneNo role')
    .populate('departmentId', 'name code')
    .populate('classId', 'name');

const pickFields = (source, fields) => {
  const picked = {};
  fields.forEach((field) => {
    if (source[field] !== undefined) {
      picked[field] = source[field];
    }
  });
  return picked;
};

const normalizeStudentPayload = (body = {}) => {
  const nestedUser = body.user && typeof body.user === 'object' ? body.user : {};
  const nestedStudent = body.student && typeof body.student === 'object' ? body.student : {};

  const userData = {
    ...pickFields(body, USER_FIELDS),
    ...pickFields(nestedUser, USER_FIELDS)
  };

  const studentData = {
    ...pickFields(body, STUDENT_FIELDS),
    ...pickFields(nestedStudent, STUDENT_FIELDS)
  };

  return { userData, studentData };
};

const ensureClassExists = async (classId) => {
  if (!classId) {
    return null;
  }

  const classDoc = await Class.findById(classId);
  return classDoc;
};

/**
 * Get all students
 * @route GET /api/students
 */
export const getAllStudents = async (req, res) => {
  try {
    const scopedDepartmentId = await getScopedDepartmentId(req);
    const filter = scopedDepartmentId ? { departmentId: scopedDepartmentId } : {};
    const students = await populateStudent(Student.find(filter));

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }
    console.error('Get students error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving students'
    });
  }
};

/**
 * Get student by ID
 * @route GET /api/students/:id
 */
export const getStudentById = async (req, res) => {
  try {
    const student = await populateStudent(Student.findById(req.params.id));

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const isAllowed = await isDepartmentAllowedForHod(req, student.departmentId?._id || student.departmentId);
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only access students from their assigned department'
      });
    }

    return res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }
    console.error('Get student error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving student'
    });
  }
};

/**
 * Create new student (creates User + Student together)
 * @route POST /api/students
 */
export const createStudent = async (req, res) => {
  try {
    const { userData, studentData } = normalizeStudentPayload(req.body);
    const { name, email, password, phoneNo, aadharNo, dob } = userData;
    const { rollNo, classId, departmentId, program, fatherName, fatherNo } = studentData;

    if (!name || !email || !password || !phoneNo || !aadharNo || !dob || !rollNo || !classId || !departmentId || !program || !fatherName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required fields: name, email, password, phoneNo, aadharNo, dob, rollNo, classId, departmentId, program, fatherName'
      });
    }

    if (userData.role && userData.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Role must be student for student creation'
      });
    }

    const normalizedEmail = String(email).toLowerCase();
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phoneNo }, { aadharNo }]
    });

    if (existingUser) {
      const field = existingUser.email === normalizedEmail
        ? 'Email'
        : existingUser.phoneNo === phoneNo
          ? 'Phone number'
          : 'Aadhar number';

      return res.status(409).json({
        success: false,
        message: `${field} already exists`
      });
    }

    const existingStudentByRoll = await Student.findOne({ rollNo });
    if (existingStudentByRoll) {
      return res.status(409).json({
        success: false,
        message: 'Roll number already linked to a student record'
      });
    }

    const classDoc = await ensureClassExists(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const scopedDepartmentId = await getScopedDepartmentId(req);
    if (scopedDepartmentId) {
      if (String(departmentId) !== scopedDepartmentId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. HOD can only create students in their assigned department'
        });
      }

      if (String(classDoc.departmentId) !== scopedDepartmentId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Selected class does not belong to your assigned department'
        });
      }
    }

    const userDoc = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: 'student',
      phoneNo,
      aadharNo,
      dob
    });

    let student;
    try {
      student = await Student.create({
        userId: userDoc._id,
        rollNo,
        classId,
        departmentId,
        program,
        fatherName,
        fatherNo
      });
    } catch (studentError) {
      await User.findByIdAndDelete(userDoc._id);
      throw studentError;
    }

    try {
      await Class.findByIdAndUpdate(classDoc._id, { $addToSet: { studentIds: student._id } });
    } catch (classSyncError) {
      await Student.findByIdAndDelete(student._id);
      await User.findByIdAndDelete(userDoc._id);
      throw classSyncError;
    }

    const populatedStudent = await populateStudent(Student.findById(student._id));

    return res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: populatedStudent
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }
    console.error('Create student error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate value - email, phone number, aadhar, or roll number already exists'
      });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    return res.status(500).json({
      success: false,
      message: 'Error creating student'
    });
  }
};

/**
 * Update student (updates User + Student together)
 * @route PUT /api/students/:id
 */
export const updateStudent = async (req, res) => {
  try {
    const { userData, studentData } = normalizeStudentPayload(req.body);

    if (userData.role && userData.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Role must remain student'
      });
    }

    const studentDoc = await Student.findById(req.params.id);
    if (!studentDoc) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const scopedDepartmentId = await getScopedDepartmentId(req);
    if (scopedDepartmentId && String(studentDoc.departmentId) !== scopedDepartmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only update students from their assigned department'
      });
    }

    const userDoc = await User.findById(studentDoc.userId);
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: 'Linked user not found for this student'
      });
    }

    if (studentData.rollNo && studentData.rollNo !== studentDoc.rollNo) {
      const existingRoll = await Student.findOne({
        rollNo: studentData.rollNo,
        _id: { $ne: studentDoc._id }
      });
      if (existingRoll) {
        return res.status(409).json({
          success: false,
          message: 'Roll number already linked to another student record'
        });
      }
    }

    if (userData.email && userData.email !== userDoc.email) {
      const normalizedEmail = String(userData.email).toLowerCase();
      const existingEmail = await User.findOne({ email: normalizedEmail, _id: { $ne: userDoc._id } });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
      userData.email = normalizedEmail;
    }

    if (userData.phoneNo && userData.phoneNo !== userDoc.phoneNo) {
      const existingPhone = await User.findOne({ phoneNo: userData.phoneNo, _id: { $ne: userDoc._id } });
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: 'Phone number already exists'
        });
      }
    }

    if (userData.aadharNo && userData.aadharNo !== userDoc.aadharNo) {
      const existingAadhar = await User.findOne({ aadharNo: userData.aadharNo, _id: { $ne: userDoc._id } });
      if (existingAadhar) {
        return res.status(409).json({
          success: false,
          message: 'Aadhar number already exists'
        });
      }
    }

    const oldClassId = studentDoc.classId ? String(studentDoc.classId) : null;
    const newClassId = studentData.classId ? String(studentData.classId) : oldClassId;

    if (studentData.classId) {
      const classDoc = await ensureClassExists(studentData.classId);
      if (!classDoc) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }
      if (scopedDepartmentId && String(classDoc.departmentId) !== scopedDepartmentId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Selected class does not belong to your assigned department'
        });
      }
    }

    if (scopedDepartmentId && studentData.departmentId && String(studentData.departmentId) !== scopedDepartmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only assign student to their own department'
      });
    }

    Object.assign(userDoc, { ...userData, role: 'student' });
    Object.assign(studentDoc, studentData);

    await userDoc.save();
    await studentDoc.save();

    if (newClassId !== oldClassId) {
      if (oldClassId) {
        await Class.findByIdAndUpdate(oldClassId, { $pull: { studentIds: studentDoc._id } });
      }
      await Class.findByIdAndUpdate(newClassId, { $addToSet: { studentIds: studentDoc._id } });
    }

    const updatedStudent = await populateStudent(Student.findById(studentDoc._id));

    return res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }
    console.error('Update student error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate value - email, phone number, aadhar, or roll number already exists'
      });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    return res.status(500).json({
      success: false,
      message: 'Error updating student'
    });
  }
};

/**
 * Delete student
 * @route DELETE /api/students/:id
 */
export const deleteStudent = async (req, res) => {
  try {
    const existingStudent = await Student.findById(req.params.id);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const isAllowed = await isDepartmentAllowedForHod(req, existingStudent.departmentId);
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only delete students from their assigned department'
      });
    }

    if (existingStudent.classId) {
      await Class.findByIdAndUpdate(existingStudent.classId, { $pull: { studentIds: existingStudent._id } });
    }

    await Student.findByIdAndDelete(req.params.id);
    await User.findByIdAndDelete(existingStudent.userId);

    return res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }
    console.error('Delete student error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting student'
    });
  }
};
