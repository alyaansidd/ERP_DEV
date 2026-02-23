import Department from '../models/Department.js';
import Faculty from '../models/Faculty.js';
import Class from '../models/Class.js';

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
    const departments = await populateDepartment(Department.find());
    return res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
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
    return res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
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
