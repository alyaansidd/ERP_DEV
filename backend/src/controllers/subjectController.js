import Subject from '../models/Subject.js';
import Faculty from '../models/Faculty.js';

/**
 * Get all subjects
 * @route GET /api/subjects
 */
export const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate('faculty', 'department designation')
      .populate('faculty.user', 'name email');
    
    return res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving subjects'
    });
  }
};

/**
 * Get subject by ID
 * @route GET /api/subjects/:id
 */
export const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('faculty', 'department designation')
      .populate('faculty.user', 'name email');
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: subject
    });
  } catch (error) {
    console.error('Get subject error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving subject'
    });
  }
};

/**
 * Create new subject
 * @route POST /api/subjects
 */
export const createSubject = async (req, res) => {
  try {
    const { name, code, department, semester, faculty: facultyId } = req.body;

    if (!name || !code || !department || !semester || !facultyId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, code, department, semester, and faculty'
      });
    }

    // Check if faculty exists
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    const subject = await Subject.create({
      name,
      code,
      department,
      semester,
      faculty: facultyId
    });

    const populatedSubject = await Subject.findById(subject._id)
      .populate('faculty', 'department designation')
      .populate('faculty.user', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: populatedSubject
    });
  } catch (error) {
    console.error('Create subject error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Subject with this code already exists'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error creating subject'
    });
  }
};

/**
 * Update subject
 * @route PUT /api/subjects/:id
 */
export const updateSubject = async (req, res) => {
  try {
    const { faculty: facultyId } = req.body;
    
    // If faculty is being updated, validate it exists
    if (facultyId) {
      const faculty = await Faculty.findById(facultyId);
      if (!faculty) {
        return res.status(404).json({
          success: false,
          message: 'Faculty not found'
        });
      }
    }

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('faculty', 'department designation')
     .populate('faculty.user', 'name email');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: subject
    });
  } catch (error) {
    console.error('Update subject error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating subject'
    });
  }
};

/**
 * Delete subject
 * @route DELETE /api/subjects/:id
 */
export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting subject'
    });
  }
};
