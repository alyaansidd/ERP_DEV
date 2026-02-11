import Notice from '../models/Notice.js';
import User from '../models/User.js';

/**
 * Get all notices
 * @route GET /api/notices
 */
export const getAllNotices = async (req, res) => {
  try {
    const { targetRole } = req.query;
    let filter = {};
    
    // Filter by target role if specified
    if (targetRole && targetRole !== 'all') {
      filter.targetRole = targetRole;
    }
    
    const notices = await Notice.find(filter)
      .populate('postedBy', 'name email role')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: notices.length,
      data: notices
    });
  } catch (error) {
    console.error('Get notices error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving notices'
    });
  }
};

/**
 * Get notice by ID
 * @route GET /api/notices/:id
 */
export const getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate('postedBy', 'name email role');
    
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: notice
    });
  } catch (error) {
    console.error('Get notice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving notice'
    });
  }
};

/**
 * Create new notice
 * @route POST /api/notices
 */
export const createNotice = async (req, res) => {
  try {
    const { title, description, targetRole, postedBy } = req.body;

    if (!title || !description || !postedBy) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and postedBy'
      });
    }

    // Check if user exists
    const user = await User.findById(postedBy);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const notice = await Notice.create({
      title,
      description,
      targetRole: targetRole || 'all',
      postedBy
    });

    const populatedNotice = await Notice.findById(notice._id)
      .populate('postedBy', 'name email role');

    return res.status(201).json({
      success: true,
      message: 'Notice created successfully',
      data: populatedNotice
    });
  } catch (error) {
    console.error('Create notice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating notice'
    });
  }
};

/**
 * Update notice
 * @route PUT /api/notices/:id
 */
export const updateNotice = async (req, res) => {
  try {
    const { postedBy } = req.body;
    
    // Validate postedBy if provided
    if (postedBy) {
      const user = await User.findById(postedBy);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    }

    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('postedBy', 'name email role');

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notice updated successfully',
      data: notice
    });
  } catch (error) {
    console.error('Update notice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating notice'
    });
  }
};

/**
 * Delete notice
 * @route DELETE /api/notices/:id
 */
export const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    console.error('Delete notice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting notice'
    });
  }
};
