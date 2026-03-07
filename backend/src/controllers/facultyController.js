import Faculty from '../models/Faculty.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import { getScopedDepartmentId, isDepartmentAllowedForHod } from '../utils/hodScope.js';

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
    const scopedDepartmentId = await getScopedDepartmentId(req);
    const filter = scopedDepartmentId ? { departmentId: scopedDepartmentId } : {};
    const faculty = await populateFaculty(Faculty.find(filter));

    return res.status(200).json({
      success: true,
      count: faculty.length,
      data: faculty
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

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

    const isAllowed = await isDepartmentAllowedForHod(req, faculty.departmentId?._id || faculty.departmentId);
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only access faculty from their assigned department'
      });
    }

    return res.status(200).json({
      success: true,
      data: faculty
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

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
  let createdUserId = null;

  try {
    const {
      userId,
      employeeNo,
      designation,
      departmentId,
      joiningDate,
      routing,
      user
    } = req.body;

    const hasUserId = Boolean(userId);
    const hasUserPayload = Boolean(user && typeof user === 'object');

    if (!employeeNo || !designation || !departmentId || !joiningDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide employeeNo, designation, departmentId, and joiningDate'
      });
    }

    const departmentDoc = await Department.findById(departmentId);
    if (!departmentDoc) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const scopedDepartmentId = await getScopedDepartmentId(req);
    if (scopedDepartmentId && String(departmentId) !== scopedDepartmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only create faculty in their assigned department'
      });
    }

    if (!hasUserId && !hasUserPayload) {
      return res.status(400).json({
        success: false,
        message: 'Provide either userId OR user{name, email, password, phoneNo, aadharNo, dob}'
      });
    }

    const employeeExists = await Faculty.findOne({ employeeNo });
    if (employeeExists) {
      return res.status(409).json({
        success: false,
        message: 'Faculty with this employeeNo already exists'
      });
    }

    let facultyUserId = userId;
    let userDoc = null;

    if (hasUserPayload) {
      // New user flow from same faculty payload
      const userPayload = user || {};
      const { name, email, password, phoneNo, aadharNo, dob, isActive } = userPayload;

      if (!name || !email || !password || !phoneNo || !aadharNo || !dob) {
        return res.status(400).json({
          success: false,
          message: 'Provide either userId OR user{name, email, password, phoneNo, aadharNo, dob}'
        });
      }

      userDoc = await User.create({
        name,
        email,
        password,
        phoneNo,
        aadharNo,
        dob,
        role: 'faculty',
        isActive: typeof isActive === 'boolean' ? isActive : true
      });

      createdUserId = userDoc._id;
      facultyUserId = userDoc._id;
    } else {
      // Existing user flow
      userDoc = await User.findById(facultyUserId);
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
    }

    // Check duplicate on userId (employeeNo already checked)
    const existing = await Faculty.findOne({ userId: facultyUserId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Faculty profile already exists for this userId',
        existingFacultyId: existing._id
      });
    }

    const faculty = await Faculty.create({
      userId: facultyUserId,
      employeeNo,
      designation,
      departmentId,
      joiningDate,
      routing
    });

    await Department.findByIdAndUpdate(
      departmentId,
      { $addToSet: { facultyIds: faculty._id } }
    );

    const populated = await populateFaculty(Faculty.findById(faculty._id));

    return res.status(201).json({
      success: true,
      message: 'Faculty created successfully',
      data: populated
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

    if (createdUserId) {
      await User.findByIdAndDelete(createdUserId).catch((cleanupError) => {
        console.error('Rollback user create error:', cleanupError.message);
      });
    }

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
        message: ['email', 'phoneNo', 'aadharNo'].includes(field)
          ? `User with this ${field} already exists`
          : `Faculty with this ${field} already exists`
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
    const existingFaculty = await Faculty.findById(req.params.id);
    if (!existingFaculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    const scopedDepartmentId = await getScopedDepartmentId(req);
    if (scopedDepartmentId && String(existingFaculty.departmentId) !== scopedDepartmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only update faculty from their assigned department'
      });
    }

    const oldDepartmentId = existingFaculty.departmentId ? String(existingFaculty.departmentId) : null;
    const newDepartmentId = req.body.departmentId ? String(req.body.departmentId) : oldDepartmentId;

    if (req.body.departmentId) {
      const departmentDoc = await Department.findById(req.body.departmentId);
      if (!departmentDoc) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }
      if (scopedDepartmentId && String(req.body.departmentId) !== scopedDepartmentId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. HOD can only assign faculty to their own department'
        });
      }
    }

    const allowedUpdates = ['employeeNo', 'designation', 'departmentId', 'joiningDate', 'routing'];
    allowedUpdates.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        existingFaculty[field] = req.body[field];
      }
    });

    await existingFaculty.save();

    if (oldDepartmentId && newDepartmentId && oldDepartmentId !== newDepartmentId) {
      await Promise.all([
        Department.findByIdAndUpdate(oldDepartmentId, { $pull: { facultyIds: existingFaculty._id } }),
        Department.findByIdAndUpdate(newDepartmentId, { $addToSet: { facultyIds: existingFaculty._id } })
      ]);
    }

    const faculty = await populateFaculty(Faculty.findById(existingFaculty._id));

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
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

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
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    const isAllowed = await isDepartmentAllowedForHod(req, faculty.departmentId);
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only delete faculty from their assigned department'
      });
    }

    await Faculty.findByIdAndDelete(req.params.id);

    // Cascade delete linked user account for this faculty profile.
    if (faculty.userId) {
      await User.findByIdAndDelete(faculty.userId);
    }

    if (faculty.departmentId) {
      await Department.findByIdAndUpdate(
        faculty.departmentId,
        { $pull: { facultyIds: faculty._id } }
      );

      await Department.updateOne(
        { _id: faculty.departmentId, hod: faculty._id },
        { $unset: { hod: '' } }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Faculty and associated user deleted successfully'
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error('Delete faculty error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting faculty'
    });
  }
};
