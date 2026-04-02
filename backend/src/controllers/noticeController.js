import Notice from '../models/Notice.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import { getScopedDepartmentId } from '../utils/hodScope.js';

const getVisibleNoticeRoles = (userRole) => {
  switch (userRole) {
    case 'admin':
      return ['all', 'student', 'faculty', 'hod'];
    case 'hod':
      return ['all', 'faculty', 'hod'];
    case 'faculty':
      return ['all', 'faculty'];
    case 'student':
      return ['all', 'student'];
    default:
      return ['all'];
  }
};

/**
 * Get all notices
 * @route GET /api/notices
 */
export const getAllNotices = async (req, res) => {
  try {
    const { targetRole } = req.query;
    const visibleRoles = getVisibleNoticeRoles(req.user?.role);
    let filter = { targetRole: { $in: visibleRoles } };

    const scopedDepartmentId = await getScopedDepartmentId(req);
    if (scopedDepartmentId) {
      filter = {
        targetRole: { $in: visibleRoles },
        $or: [
          { departmentId: scopedDepartmentId },
          { departmentId: { $exists: false } },
          { departmentId: null },
          { targetRole: 'all' }
        ]
      };
    }
    
    // Filter by target role if specified
    if (targetRole && targetRole !== 'all') {
      if (!visibleRoles.includes(targetRole)) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }

      filter = {
        ...filter,
        targetRole
      };
    }
    
    const notices = await Notice.find(filter)
      .populate('postedBy', 'name email role')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: notices.length,
      data: notices
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

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
      .populate('postedBy', 'name email role')
      .populate('departmentId', 'name code');
    
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    const visibleRoles = getVisibleNoticeRoles(req.user?.role);
    if (!visibleRoles.includes(notice.targetRole || 'all')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This notice is not visible for your role.'
      });
    }
    
    const scopedDepartmentId = await getScopedDepartmentId(req);
    const noticeDepartmentId = String(notice.departmentId?._id || notice.departmentId || '');
    const isGlobalNotice = !noticeDepartmentId;
    if (scopedDepartmentId && !isGlobalNotice && noticeDepartmentId !== scopedDepartmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only access notices from their assigned department'
      });
    }

    return res.status(200).json({
      success: true,
      data: notice
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

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
 * Access: admin, hod, faculty only
 */
export const createNotice = async (req, res) => {
  try {
    const { title, description, targetRole, departmentId } = req.body;
    const postedBy = req.user?.id;
    const userRole = req.user?.role;

    // Verify user is staff (admin, hod, or faculty)
    const staffRoles = ['admin', 'hod', 'faculty'];
    if (!staffRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin, HOD, or faculty can create notices.'
      });
    }

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and description'
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

    const scopedDepartmentId = await getScopedDepartmentId(req);
    let resolvedDepartmentId = departmentId;

    if (scopedDepartmentId) {
      resolvedDepartmentId = scopedDepartmentId;
    }

    if (resolvedDepartmentId) {
      const department = await Department.findById(resolvedDepartmentId);
      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    const notice = await Notice.create({
      title,
      description,
      targetRole: targetRole || 'all',
      postedBy,
      departmentId: resolvedDepartmentId || undefined
    });

    const populatedNotice = await Notice.findById(notice._id)
      .populate('postedBy', 'name email role')
      .populate('departmentId', 'name code');

    return res.status(201).json({
      success: true,
      message: 'Notice created successfully',
      data: populatedNotice
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

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
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    const scopedDepartmentId = await getScopedDepartmentId(req);
    if (scopedDepartmentId && String(notice.departmentId || '') !== scopedDepartmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only update notices from their assigned department.'
      });
    }

    if (String(notice.postedBy) !== String(req.user?.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the notice creator can update this notice.'
      });
    }

    const updatePayload = { ...req.body };
    delete updatePayload.postedBy;

    if (scopedDepartmentId) {
      updatePayload.departmentId = scopedDepartmentId;
    } else if (Object.prototype.hasOwnProperty.call(updatePayload, 'departmentId') && updatePayload.departmentId) {
      const department = await Department.findById(updatePayload.departmentId);
      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    const updatedNotice = await Notice.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true }
    )
      .populate('postedBy', 'name email role')
      .populate('departmentId', 'name code');

    return res.status(200).json({
      success: true,
      message: 'Notice updated successfully',
      data: updatedNotice
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

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
 * Access: creator only
 */
export const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    const scopedDepartmentId = await getScopedDepartmentId(req);
    if (scopedDepartmentId && String(notice.departmentId || '') !== scopedDepartmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only delete notices from their assigned department.'
      });
    }

    const isCreator = String(notice.postedBy) === String(req.user?.id);

    if (!isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the notice creator can delete this notice.'
      });
    }

    await Notice.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error('Delete notice error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting notice'
    });
  }
};
