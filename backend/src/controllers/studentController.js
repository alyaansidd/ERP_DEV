import Student from '../models/Student.js';
import User from '../models/User.js';

/**
 * Populate helper — reuses the same populate chain everywhere.
 */
const populateStudent = (query) =>
  query
    .populate('userId', 'name email phoneNo role')
    .populate('departmentId', 'name code')
    .populate('classId', 'name');

/**
 * Get all students
 * @route GET /api/students
 */
export const getAllStudents = async (req, res) => {
  try {
    const students = await populateStudent(Student.find());

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
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

    return res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Get student error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving student'
    });
  }
};

/**
 * Create new student
 * @route POST /api/students
 */
export const createStudent = async (req, res) => {
  try {
    const { userId, rollNo, classId, departmentId, program, fatherName, fatherNo } = req.body;

    // Required-field check
    if (!userId || !rollNo || !classId || !departmentId || !program || !fatherName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: userId, rollNo, classId, departmentId, program, fatherName'
      });
    }

    // Verify the user exists and has the student role
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    if (userDoc.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'User must have student role'
      });
    }

    // Duplicate check — rollNo or userId
    const existing = await Student.findOne({ $or: [{ rollNo }, { userId }] });
    if (existing) {
      const field = existing.rollNo === rollNo ? 'Roll number' : 'User';
      return res.status(409).json({
        success: false,
        message: `${field} already linked to a student record`
      });
    }

    const student = await Student.create({
      userId,
      rollNo,
      classId,
      departmentId,
      program,
      fatherName,
      fatherNo
    });

    const populatedStudent = await populateStudent(Student.findById(student._id));

    return res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: populatedStudent
    });
  } catch (error) {
    console.error('Create student error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate value — roll number or user already exists'
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
 * Update student
 * @route PUT /api/students/:id
 */
export const updateStudent = async (req, res) => {
  try {
    const student = await populateStudent(
      Student.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      })
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    console.error('Update student error:', error);
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
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting student'
    });
  }
};
