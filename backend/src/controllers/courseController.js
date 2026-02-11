import Course from '../models/Course.js';

/**
 * Get all courses
 * @route GET /api/courses
 */
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('department', 'name code');
    
    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error('Get courses error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving courses'
    });
  }
};

/**
 * Get course by ID
 * @route GET /api/courses/:id
 */
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('department', 'name code');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Get course error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving course'
    });
  }
};

/**
 * Create new course
 * @route POST /api/courses
 */
export const createCourse = async (req, res) => {
  try {
    const { name, code, department, semester, credits } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both name and code'
      });
    }

    const course = await Course.create({
      name,
      code,
      department,
      semester,
      credits
    });

    const populatedCourse = await Course.findById(course._id)
      .populate('department', 'name code');

    return res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: populatedCourse
    });
  } catch (error) {
    console.error('Create course error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Course with this code already exists'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error creating course'
    });
  }
};

/**
 * Update course
 * @route PUT /api/courses/:id
 */
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('department', 'name code');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    console.error('Update course error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating course'
    });
  }
};

/**
 * Delete course
 * @route DELETE /api/courses/:id
 */
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting course'
    });
  }
};
