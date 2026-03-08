import Department from '../models/Department.js';
import Faculty from '../models/Faculty.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import { getScopedDepartmentId } from '../utils/hodScope.js';

/** Consistent populate for Department queries */
const populateDepartment = (query) =>
  query
    .populate('hod', 'userId employeeNo designation')
    .populate('facultyIds', 'userId employeeNo designation')
    .populate('classIds', 'name roomNo');

const normalizeDepartmentCode = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const buildDepartmentCodeBase = (name) => {
  const cleaned = String(name || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'DEPT';

  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length === 1) {
    return normalizeDepartmentCode(parts[0]).slice(0, 8) || 'DEPT';
  }

  return normalizeDepartmentCode(parts.map((p) => p[0]).join('')).slice(0, 8) || 'DEPT';
};

const resolveUniqueDepartmentCode = async (preferredCode, name) => {
  const base = normalizeDepartmentCode(preferredCode) || buildDepartmentCodeBase(name);
  let candidate = base;
  let sequence = 1;

  // Ensure uniqueness even if similar codes already exist.
  while (await Department.exists({ code: candidate })) {
    candidate = `${base.slice(0, 6)}${String(sequence).padStart(2, '0')}`;
    sequence += 1;
  }

  return candidate;
};

/**
 * Get all departments
 * @route GET /api/departments
 */
export const getAllDepartments = async (req, res) => {
  try {
    const scopedDepartmentId = await getScopedDepartmentId(req);
    const filter = scopedDepartmentId ? { _id: scopedDepartmentId } : {};

    const departments = await populateDepartment(Department.find(filter));
    return res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error('Get departments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving departments'
    });
  }
};

/**
 * Get department by ID
 * @route GET /api/departments/:id
 */
export const getDepartmentById = async (req, res) => {
  try {
    const department = await populateDepartment(Department.findById(req.params.id));
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const scopedDepartmentId = await getScopedDepartmentId(req);
    if (scopedDepartmentId && String(department._id) !== scopedDepartmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only access their assigned department'
      });
    }

    return res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error('Get department error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving department'
    });
  }
};

/**
 * Create new department
 * @route POST /api/departments
 */
export const createDepartment = async (req, res) => {
  try {
    const { name, code, hod, facultyIds, classIds } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide department name'
      });
    }

    const finalCode = await resolveUniqueDepartmentCode(code, name);

    // Validate HOD if provided
    if (hod) {
      const hodFaculty = await Faculty.findById(hod);
      if (!hodFaculty) {
        return res.status(404).json({
          success: false,
          message: 'HOD Faculty not found'
        });
      }
    }

    // Validate facultyIds if provided
    if (facultyIds && facultyIds.length > 0) {
      const facultyDocs = await Faculty.find({ _id: { $in: facultyIds } });
      if (facultyDocs.length !== facultyIds.length) {
        return res.status(404).json({
          success: false,
          message: 'Some faculty members not found'
        });
      }
    }

    // Validate classIds if provided
    if (classIds && classIds.length > 0) {
      const classDocs = await Class.find({ _id: { $in: classIds } });
      if (classDocs.length !== classIds.length) {
        return res.status(404).json({
          success: false,
          message: 'Some classes not found'
        });
      }
    }

    const department = await Department.create({
      name,
      code: finalCode,
      hod,
      facultyIds,
      classIds
    });

    const populated = await populateDepartment(Department.findById(department._id));

    return res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: populated
    });
  } catch (error) {
    console.error('Create department error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', ')
      });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(409).json({
        success: false,
        message: field === 'code'
          ? 'Department with this code already exists'
          : 'Department with this name already exists'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error creating department'
    });
  }
};

/**
 * Update department
 * @route PUT /api/departments/:id
 */
export const updateDepartment = async (req, res) => {
  try {
    const scopedDepartmentId = await getScopedDepartmentId(req);
    if (scopedDepartmentId && String(req.params.id) !== scopedDepartmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only update their assigned department'
      });
    }

    const { hod, facultyIds, classIds } = req.body;

    if (Object.prototype.hasOwnProperty.call(req.body, 'code')) {
      const normalizedCode = normalizeDepartmentCode(req.body.code);
      if (!normalizedCode) {
        return res.status(400).json({
          success: false,
          message: 'Department code cannot be empty'
        });
      }
      req.body.code = normalizedCode;
    }

    // Validate HOD if provided
    if (hod) {
      const hodFaculty = await Faculty.findById(hod);
      if (!hodFaculty) {
        return res.status(404).json({
          success: false,
          message: 'HOD Faculty not found'
        });
      }

      if (scopedDepartmentId && String(hodFaculty.departmentId) !== scopedDepartmentId) {
        return res.status(400).json({
          success: false,
          message: 'HOD must belong to your assigned department'
        });
      }
    }

    // Validate facultyIds if provided
    if (facultyIds && facultyIds.length > 0) {
      const facultyDocs = await Faculty.find({ _id: { $in: facultyIds } });
      if (facultyDocs.length !== facultyIds.length) {
        return res.status(404).json({
          success: false,
          message: 'Some faculty members not found'
        });
      }

      if (scopedDepartmentId) {
        const invalidFaculty = facultyDocs.find((faculty) => String(faculty.departmentId) !== scopedDepartmentId);
        if (invalidFaculty) {
          return res.status(400).json({
            success: false,
            message: 'All faculty must belong to your assigned department'
          });
        }
      }
    }

    // Validate classIds if provided
    if (classIds && classIds.length > 0) {
      const classDocs = await Class.find({ _id: { $in: classIds } });
      if (classDocs.length !== classIds.length) {
        return res.status(404).json({
          success: false,
          message: 'Some classes not found'
        });
      }

      if (scopedDepartmentId) {
        const invalidClass = classDocs.find((classDoc) => String(classDoc.departmentId) !== scopedDepartmentId);
        if (invalidClass) {
          return res.status(400).json({
            success: false,
            message: 'All classes must belong to your assigned department'
          });
        }
      }
    }

    const department = await populateDepartment(
      Department.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error('Update department error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', ')
      });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(409).json({
        success: false,
        message: field === 'code'
          ? 'Department with this code already exists'
          : 'Department with this name already exists'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error updating department'
    });
  }
};

/**
 * Delete department
 * @route DELETE /api/departments/:id
 */
export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Delete department error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting department'
    });
  }
};

/**
 * Assign/Reassign HOD in one operation (admin only)
 * @route POST /api/departments/assign-hod
 * @body One of:
 *   - { facultyId, departmentId? } // existing faculty
 *   - { userId, departmentId, employeeNo?, joiningDate?, designation? } // existing user
 *   - { user: {...}, faculty: {...}, departmentId? } // create new user + faculty and assign HOD
 */
export const assignHod = async (req, res) => {
  let createdUserId = null;
  let createdFacultyId = null;

  try {
    const {
      facultyId,
      userId,
      departmentId,
      employeeNo,
      designation,
      joiningDate,
      user,
      faculty
    } = req.body;

    const hasFacultyId = Boolean(facultyId);
    const hasUserId = Boolean(userId);
    const hasUserPayload = Boolean(user && typeof user === 'object');
    const hasFacultyPayload = Boolean(faculty && typeof faculty === 'object');
    const requestedDepartmentId = departmentId || faculty?.departmentId || null;

    if (!hasFacultyId && !hasUserId && !hasUserPayload) {
      return res.status(400).json({
        success: false,
        message: 'Provide one of: facultyId, userId, or user payload'
      });
    }

    let facultyProfile = null;
    let userDoc = null;

    // Existing faculty flow (explicit facultyId)
    if (hasFacultyId) {
      facultyProfile = await Faculty.findById(facultyId);
      if (!facultyProfile) {
        return res.status(404).json({
          success: false,
          message: 'Faculty not found'
        });
      }

      userDoc = await User.findById(facultyProfile.userId);
      if (!userDoc) {
        return res.status(404).json({
          success: false,
          message: 'Linked user for faculty not found'
        });
      }
    } else if (hasUserId) {
      // Existing user flow
      userDoc = await User.findById(userId);
      if (!userDoc) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!['faculty', 'hod'].includes(userDoc.role)) {
        return res.status(400).json({
          success: false,
          message: 'Only faculty or hod users can be assigned as HOD'
        });
      }

      facultyProfile = await Faculty.findOne({ userId: userDoc._id });
    } else {
      // New user + faculty payload flow
      const userPayload = user || {};
      const facultyPayload = faculty || {};
      const resolvedEmployeeNo = employeeNo || facultyPayload.employeeNo;
      const resolvedDesignation = designation || facultyPayload.designation || 'HOD';
      const resolvedJoiningDate = joiningDate || facultyPayload.joiningDate;

      const { name, email, password, phoneNo, aadharNo, dob, isActive } = userPayload;

      if (!name || !email || !password || !phoneNo || !aadharNo || !dob) {
        return res.status(400).json({
          success: false,
          message: 'For new HOD, provide user{name, email, password, phoneNo, aadharNo, dob}'
        });
      }

      if (!resolvedEmployeeNo || !resolvedJoiningDate) {
        return res.status(400).json({
          success: false,
          message: 'For new HOD, provide faculty employeeNo and joiningDate'
        });
      }

      const duplicateUser = await User.findOne({
        $or: [{ email }, { phoneNo }, { aadharNo }]
      });
      if (duplicateUser) {
        return res.status(409).json({
          success: false,
          message: 'User with same email, phoneNo, or aadharNo already exists'
        });
      }

      const duplicateEmployeeNo = await Faculty.findOne({ employeeNo: resolvedEmployeeNo });
      if (duplicateEmployeeNo) {
        return res.status(409).json({
          success: false,
          message: 'Faculty with this employeeNo already exists'
        });
      }

      userDoc = await User.create({
        name,
        email,
        password,
        phoneNo,
        aadharNo,
        dob,
        role: 'hod',
        isActive: typeof isActive === 'boolean' ? isActive : true
      });
      createdUserId = userDoc._id;

      if (!requestedDepartmentId) {
        return res.status(400).json({
          success: false,
          message: 'departmentId is required to create a new faculty profile for HOD'
        });
      }

      facultyProfile = await Faculty.create({
        userId: userDoc._id,
        employeeNo: resolvedEmployeeNo,
        designation: resolvedDesignation,
        departmentId: requestedDepartmentId,
        joiningDate: resolvedJoiningDate,
        routing: facultyPayload.routing
      });
      createdFacultyId = facultyProfile._id;
    }

    // Backward compatibility and new payload support for faculty details.
    if (!facultyProfile) {
      const facultyPayload = faculty || {};
      const resolvedEmployeeNo = employeeNo || facultyPayload.employeeNo;
      const resolvedDesignation = designation || facultyPayload.designation || 'HOD';
      const resolvedJoiningDate = joiningDate || facultyPayload.joiningDate;
      const resolvedRouting = facultyPayload.routing;

      if (!resolvedEmployeeNo || !resolvedJoiningDate) {
        return res.status(400).json({
          success: false,
          message: 'Faculty profile does not exist. Provide employeeNo and joiningDate to create it automatically.'
        });
      }

      const duplicateEmployeeNo = await Faculty.findOne({ employeeNo: resolvedEmployeeNo });
      if (duplicateEmployeeNo) {
        return res.status(409).json({
          success: false,
          message: 'Faculty with this employeeNo already exists'
        });
      }

      if (!requestedDepartmentId) {
        return res.status(400).json({
          success: false,
          message: 'departmentId is required to create a faculty profile for this user'
        });
      }

      facultyProfile = await Faculty.create({
        userId: userDoc._id,
        employeeNo: resolvedEmployeeNo,
        designation: resolvedDesignation,
        departmentId: requestedDepartmentId,
        joiningDate: resolvedJoiningDate,
        routing: resolvedRouting
      });
      createdFacultyId = facultyProfile._id;
    }

    if (!userDoc) {
      userDoc = await User.findById(facultyProfile.userId);
    }

    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const targetDepartmentId = requestedDepartmentId || facultyProfile.departmentId;
    if (!targetDepartmentId) {
      return res.status(400).json({
        success: false,
        message: 'departmentId is required when faculty has no department allocation'
      });
    }

    const department = await Department.findById(targetDepartmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const oldDepartmentId = facultyProfile.departmentId ? String(facultyProfile.departmentId) : null;
    const resolvedDepartmentId = String(department._id);
    const previousTargetHodId = department.hod ? String(department.hod) : null;

    if (oldDepartmentId !== resolvedDepartmentId) {
      facultyProfile.departmentId = department._id;
      await facultyProfile.save();
    }

    await Promise.all([
      Department.updateMany(
        { hod: facultyProfile._id, _id: { $ne: department._id } },
        { $unset: { hod: '' } }
      ),
      Department.findByIdAndUpdate(
        department._id,
        {
          $set: { hod: facultyProfile._id },
          $addToSet: { facultyIds: facultyProfile._id }
        }
      )
    ]);

    if (oldDepartmentId && oldDepartmentId !== resolvedDepartmentId) {
      await Department.findByIdAndUpdate(
        oldDepartmentId,
        { $pull: { facultyIds: facultyProfile._id } }
      );
    }

    if (userDoc.role !== 'hod') {
      userDoc.role = 'hod';
      await userDoc.save();
    }

    if (previousTargetHodId && previousTargetHodId !== String(facultyProfile._id)) {
      const previousHodFaculty = await Faculty.findById(previousTargetHodId).select('_id userId');
      if (previousHodFaculty?.userId) {
        const stillAssignedAsHod = await Department.exists({ hod: previousHodFaculty._id });
        if (!stillAssignedAsHod) {
          await User.updateOne(
            { _id: previousHodFaculty.userId, role: 'hod' },
            { $set: { role: 'faculty' } }
          );
        }
      }
    }

    const updatedDepartment = await populateDepartment(Department.findById(department._id));

    return res.status(200).json({
      success: true,
      message: 'HOD assigned successfully',
      data: {
        department: updatedDepartment,
        assignedHodFacultyId: facultyProfile._id,
        assignedHodUserId: userDoc._id,
        createdFacultyProfile: Boolean(createdFacultyId),
        createdUserProfile: Boolean(createdUserId)
      }
    });
  } catch (error) {
    if (createdFacultyId) {
      await Faculty.findByIdAndDelete(createdFacultyId).catch(() => {});
    }
    if (createdUserId) {
      await User.findByIdAndDelete(createdUserId).catch(() => {});
    }

    console.error('Assign HOD error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', ')
      });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(409).json({
        success: false,
        message: field ? `${field} already exists` : 'Duplicate key error'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error assigning HOD'
    });
  }
};
