import Class from '../models/Class.js';
import Department from '../models/Department.js';
import Faculty from '../models/Faculty.js';
import Student from '../models/Student.js';

/** Consistent populate for Class queries */
const populateClass = (query) =>
  query
    .populate('departmentId', 'name')
    .populate('coordinatorId', 'userId employeeNo designation')
    .populate('studentIds', 'rollNo userId');

/**
 * Get all classes
 * @route GET /api/classes
 */
export const getAllClasses = async (req, res) => {
  try {
    const classes = await populateClass(Class.find());

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
    const classDoc = await populateClass(Class.findById(req.params.id));

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
    const { name, departmentId, coordinatorId, roomNo, studentIds, timeTable } = req.body;

    if (!name || !departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and departmentId'
      });
    }

    // Validate department exists
    const dept = await Department.findById(departmentId);
    if (!dept) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Validate coordinator if provided
    if (coordinatorId) {
      const coordinator = await Faculty.findById(coordinatorId);
      if (!coordinator) {
        return res.status(404).json({
          success: false,
          message: 'Coordinator Faculty not found'
        });
      }
    }

    // Validate studentIds if provided
    if (studentIds && studentIds.length > 0) {
      const students = await Student.find({ _id: { $in: studentIds } });
      if (students.length !== studentIds.length) {
        return res.status(404).json({
          success: false,
          message: 'Some students not found'
        });
      }
    }

    const classDoc = await Class.create({
      name,
      departmentId,
      coordinatorId,
      roomNo,
      studentIds,
      timeTable
    });

    const populated = await populateClass(Class.findById(classDoc._id));

    return res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: populated
    });
  } catch (error) {
    console.error('Create class error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', ')
      });
    }
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
    const { departmentId, coordinatorId, studentIds } = req.body;

    // Validate department if provided
    if (departmentId) {
      const dept = await Department.findById(departmentId);
      if (!dept) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    // Validate coordinator if provided
    if (coordinatorId) {
      const coordinator = await Faculty.findById(coordinatorId);
      if (!coordinator) {
        return res.status(404).json({
          success: false,
          message: 'Coordinator Faculty not found'
        });
      }
    }

    // Validate studentIds if provided
    if (studentIds && studentIds.length > 0) {
      const students = await Student.find({ _id: { $in: studentIds } });
      if (students.length !== studentIds.length) {
        return res.status(404).json({
          success: false,
          message: 'Some students not found'
        });
      }
    }

    const classDoc = await populateClass(
      Class.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      })
    );

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
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', ')
      });
    }
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
