import Department from '../models/Department.js';

/**
 * Get all departments
 * @route GET /api/departments
 */
export const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
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
    const department = await Department.findById(req.params.id);
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
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both name and code'
      });
    }

    const department = await Department.create({ name, code });
    return res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    console.error('Create department error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Department with this name or code already exists'
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
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
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
