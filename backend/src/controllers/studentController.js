import Student from '../models/Student.js';
import User from '../models/User.js';

/**
 * Get all students
 * @route GET /api/students
 */
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate('user', 'name email role')
      .populate('department', 'name code')
      .populate('class', 'name');
    
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
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email role')
      .populate('department', 'name code')
      .populate('class', 'name');
    
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
    const { rollNo, department, class: classId, semester, admissionYear, user } = req.body;

    if (!rollNo || !user) {
      return res.status(400).json({
        success: false,
        message: 'Please provide roll number and user ID'
      });
    }

    // Check if user exists and has student role
    const userDoc = await User.findById(user);
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

    // Check if roll number already exists
    const existingStudent = await Student.findOne({ rollNo });
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'Roll number already exists'
      });
    }

    const student = await Student.create({
      rollNo,
      department,
      class: classId,
      semester,
      admissionYear,
      user
    });

    const populatedStudent = await Student.findById(student._id)
      .populate('user', 'name email role')
      .populate('department', 'name code')
      .populate('class', 'name');

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
        message: 'Roll number already exists'
      });
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
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name email role')
     .populate('department', 'name code')
     .populate('class', 'name');

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
