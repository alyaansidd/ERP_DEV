import Faculty from '../models/Faculty.js';
import User from '../models/User.js';

/** Consistent populate for Faculty queries */
const populateFaculty = (query) =>
  query
    .populate('userId', 'name email phoneNo role')
    .populate('departmentId', 'name code');

/**
 * Get all faculty members
 * @route GET /api/faculty
 */
export const getAllFaculty = async (req, res) => {
  try {
    const faculty = await populateFaculty(Faculty.find());

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
    const faculty = await populateFaculty(Faculty.findById(req.params.id));

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
    const { userId, employeeNo, designation, departmentId, joiningDate, routing } = req.body;

    if (!userId || !employeeNo || !designation || !departmentId || !joiningDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, employeeNo, designation, departmentId, and joiningDate'
      });
    }

    // Check if user exists and has faculty role
    const userDoc = await User.findById(userId);
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

    // Check for duplicates on userId or employeeNo
    const existing = await Faculty.findOne({ $or: [{ userId }, { employeeNo }] });
    if (existing) {
      const field = existing.userId.toString() === userId ? 'userId' : 'employeeNo';
      return res.status(409).json({
        success: false,
        message: `Faculty with this ${field} already exists`
      });
    }

    const faculty = await Faculty.create({
      userId,
      employeeNo,
      designation,
      departmentId,
      joiningDate,
      routing
    });

    const populated = await populateFaculty(Faculty.findById(faculty._id));

    return res.status(201).json({
      success: true,
      message: 'Faculty created successfully',
      data: populated
    });
  } catch (error) {
    console.error('Create faculty error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', ')
      });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Faculty with this ${field} already exists`
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
    const faculty = await populateFaculty(
      Faculty.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      })
    );

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
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', ')
      });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Faculty with this ${field} already exists`
      });
    }
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
