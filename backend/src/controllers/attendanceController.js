import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';

/**
 * Get all attendance records
 * @route GET /api/attendance
 */
export const getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate('student', 'rollNo')
      .populate('student.user', 'name email')
      .populate('course', 'name code');
    
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
    const attendance = await Attendance.findById(req.params.id)
      .populate('student', 'rollNo')
      .populate('student.user', 'name email')
      .populate('course', 'name code');
    
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
    const { student, course, date, status } = req.body;

    if (!student || !course || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide student, course, and date'
      });
    }

    // Check if student exists
    const studentDoc = await Student.findById(student);
    if (!studentDoc) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if course exists
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const attendance = await Attendance.create({
      student,
      course,
      date,
      status: status || 'Present'
    });

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('student', 'rollNo')
      .populate('student.user', 'name email')
      .populate('course', 'name code');

    return res.status(201).json({
      success: true,
      message: 'Attendance record created successfully',
      data: populatedAttendance
    });
  } catch (error) {
    console.error('Create attendance error:', error);
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
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('student', 'rollNo')
     .populate('student.user', 'name email')
     .populate('course', 'name code');

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
