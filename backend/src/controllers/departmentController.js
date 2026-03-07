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
    const { name, hod, facultyIds, classIds } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide department name'
      });
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
      return res.status(409).json({
        success: false,
        message: 'Department with this name already exists'
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
      return res.status(409).json({
        success: false,
        message: 'Department with this name already exists'
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
 * @body { userId, departmentId }
 */
export const assignHod = async (req, res) => {
  try {
    const { userId, departmentId, employeeNo, designation, joiningDate } = req.body;

    if (!userId || !departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId and departmentId'
      });
    }

    const [user, department] = await Promise.all([
      User.findById(userId),
      Department.findById(departmentId)
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    if (!['faculty', 'hod'].includes(user.role)) {
      return res.status(400).json({
        success: false,
        message: 'Only faculty or hod users can be assigned as HOD'
      });
    }

    let facultyProfile = await Faculty.findOne({ userId: user._id });
    let createdFacultyProfile = false;

    if (!facultyProfile) {
      if (!employeeNo || !joiningDate) {
        return res.status(400).json({
          success: false,
          message: 'Faculty profile does not exist. Provide employeeNo and joiningDate to create it automatically.'
        });
      }

      const existingEmployee = await Faculty.findOne({ employeeNo });
      if (existingEmployee) {
        return res.status(409).json({
          success: false,
          message: 'Faculty with this employeeNo already exists'
        });
      }

      facultyProfile = await Faculty.create({
        userId: user._id,
        employeeNo,
        designation: designation || 'HOD',
        departmentId: department._id,
        joiningDate
      });
      createdFacultyProfile = true;
    }

    const oldDepartmentId = facultyProfile.departmentId ? String(facultyProfile.departmentId) : null;
    const targetDepartmentId = String(department._id);
    const previousTargetHodId = department.hod ? String(department.hod) : null;

    if (oldDepartmentId !== targetDepartmentId) {
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

    if (oldDepartmentId && oldDepartmentId !== targetDepartmentId) {
      await Department.findByIdAndUpdate(
        oldDepartmentId,
        { $pull: { facultyIds: facultyProfile._id } }
      );
    }

    if (user.role !== 'hod') {
      user.role = 'hod';
      await user.save();
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
        assignedHodUserId: user._id,
        createdFacultyProfile
      }
    });
  } catch (error) {
    console.error('Assign HOD error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error assigning HOD'
    });
  }
};
