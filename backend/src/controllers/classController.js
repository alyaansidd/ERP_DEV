import Class from '../models/Class.js';
import Department from '../models/Department.js';

/**
 * Get all classes
 * @route GET /api/classes
 */
export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('department', 'name code')
      .populate('academicYear', 'year');
    
    return res.status(200).json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (error) {
    console.error('Get classes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving classes'
    });
  }
};

/**
 * Get class by ID
 * @route GET /api/classes/:id
 */
export const getClassById = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id)
      .populate('department', 'name code')
      .populate('academicYear', 'year');
    
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: classDoc
    });
  } catch (error) {
    console.error('Get class error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving class'
    });
  }
};

/**
 * Create new class
 * @route POST /api/classes
 */
export const createClass = async (req, res) => {
  try {
    const { name, department, semester, academicYear } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide class name'
      });
    }

    // Validate department if provided
    if (department) {
      const dept = await Department.findById(department);
      if (!dept) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    const classDoc = await Class.create({
      name,
      department,
      semester,
      academicYear
    });

    const populatedClass = await Class.findById(classDoc._id)
      .populate('department', 'name code')
      .populate('academicYear', 'year');

    return res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: populatedClass
    });
  } catch (error) {
    console.error('Create class error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating class'
    });
  }
};

/**
 * Update class
 * @route PUT /api/classes/:id
 */
export const updateClass = async (req, res) => {
  try {
    const { department, academicYear } = req.body;
    
    // Validate department if provided
    if (department) {
      const dept = await Department.findById(department);
      if (!dept) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    const classDoc = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('department', 'name code')
     .populate('academicYear', 'year');

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: classDoc
    });
  } catch (error) {
    console.error('Update class error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating class'
    });
  }
};

/**
 * Delete class
 * @route DELETE /api/classes/:id
 */
export const deleteClass = async (req, res) => {
  try {
    const classDoc = await Class.findByIdAndDelete(req.params.id);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Delete class error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting class'
    });
  }
};
