import Faculty from '../models/Faculty.js';
import User from '../models/User.js';

/**
 * Get all faculty members
 * @route GET /api/faculty
 */
export const getAllFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find()
      .populate('user', 'name email role')
      .populate('department', 'name code');
    
    return res.status(200).json({
      success: true,
      count: faculty.length,
      data: faculty
    });
  } catch (error) {
    console.error('Get faculty error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving faculty members'
    });
  }
};

/**
 * Get faculty by ID
 * @route GET /api/faculty/:id
 */
export const getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('user', 'name email role')
      .populate('department', 'name code');
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: faculty
    });
  } catch (error) {
    console.error('Get faculty error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving faculty'
    });
  }
};

/**
 * Create new faculty
 * @route POST /api/faculty
 */
export const createFaculty = async (req, res) => {
  try {
    const { department, designation, user } = req.body;

    if (!department || !designation || !user) {
      return res.status(400).json({
        success: false,
        message: 'Please provide department, designation, and user ID'
      });
    }

    // Check if user exists and has faculty role
    const userDoc = await User.findById(user);
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (userDoc.role !== 'faculty') {
      return res.status(400).json({
        success: false,
        message: 'User must have faculty role'
      });
    }

    // Check if faculty already exists for this user
    const existingFaculty = await Faculty.findOne({ user });
    if (existingFaculty) {
      return res.status(409).json({
        success: false,
        message: 'Faculty profile already exists for this user'
      });
    }

    const faculty = await Faculty.create({
      department,
      designation,
      user
    });

    const populatedFaculty = await Faculty.findById(faculty._id)
      .populate('user', 'name email role')
      .populate('department', 'name code');

    return res.status(201).json({
      success: true,
      message: 'Faculty created successfully',
      data: populatedFaculty
    });
  } catch (error) {
    console.error('Create faculty error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Faculty profile already exists for this user'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error creating faculty'
    });
  }
};

/**
 * Update faculty
 * @route PUT /api/faculty/:id
 */
export const updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name email role')
     .populate('department', 'name code');

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Faculty updated successfully',
      data: faculty
    });
  } catch (error) {
    console.error('Update faculty error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating faculty'
    });
  }
};

/**
 * Delete faculty
 * @route DELETE /api/faculty/:id
 */
export const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Faculty deleted successfully'
    });
  } catch (error) {
    console.error('Delete faculty error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting faculty'
    });
  }
};
