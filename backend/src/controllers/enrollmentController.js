import Enrollment from '../models/Enrollment.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';

/**
 * Get all enrollments
 * @route GET /api/enrollments
 */
export const getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate('student', 'rollNo')
      .populate('student.user', 'name email')
      .populate('course', 'name code')
      .populate('academicYear', 'year');
    
    return res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving enrollments'
    });
  }
};

/**
 * Get enrollment by ID
 * @route GET /api/enrollments/:id
 */
export const getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('student', 'rollNo')
      .populate('student.user', 'name email')
      .populate('course', 'name code')
      .populate('academicYear', 'year');
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Get enrollment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving enrollment'
    });
  }
};

/**
 * Create new enrollment
 * @route POST /api/enrollments
 */
export const createEnrollment = async (req, res) => {
  try {
    const { student, course, academicYear } = req.body;

    if (!student || !course) {
      return res.status(400).json({
        success: false,
        message: 'Please provide student and course'
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

    // Check if enrollment already exists
    const existingEnrollment = await Enrollment.findOne({ student, course });
    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: 'Student is already enrolled in this course'
      });
    }

    const enrollment = await Enrollment.create({
      student,
      course,
      academicYear
    });

    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate('student', 'rollNo')
      .populate('student.user', 'name email')
      .populate('course', 'name code')
      .populate('academicYear', 'year');

    return res.status(201).json({
      success: true,
      message: 'Enrollment created successfully',
      data: populatedEnrollment
    });
  } catch (error) {
    console.error('Create enrollment error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Student is already enrolled in this course'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error creating enrollment'
    });
  }
};

/**
 * Update enrollment
 * @route PUT /api/enrollments/:id
 */
export const updateEnrollment = async (req, res) => {
  try {
    const { student, course, academicYear } = req.body;
    
    // Validate student if provided
    if (student) {
      const studentDoc = await Student.findById(student);
      if (!studentDoc) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }
    }

    // Validate course if provided
    if (course) {
      const courseDoc = await Course.findById(course);
      if (!courseDoc) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }
    }

    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('student', 'rollNo')
     .populate('student.user', 'name email')
     .populate('course', 'name code')
     .populate('academicYear', 'year');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Enrollment updated successfully',
      data: enrollment
    });
  } catch (error) {
    console.error('Update enrollment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating enrollment'
    });
  }
};

/**
 * Delete enrollment
 * @route DELETE /api/enrollments/:id
 */
export const deleteEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Enrollment deleted successfully'
    });
  } catch (error) {
    console.error('Delete enrollment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting enrollment'
    });
  }
};
