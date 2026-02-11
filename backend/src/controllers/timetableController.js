import Timetable from '../models/Timetable.js';
import Subject from '../models/Subject.js';
import Faculty from '../models/Faculty.js';

/**
 * Get all timetable entries
 * @route GET /api/timetable
 */
export const getAllTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.find()
      .populate('subject', 'name code')
      .populate('faculty', 'designation')
      .populate('faculty.user', 'name email');
    
    return res.status(200).json({
      success: true,
      count: timetable.length,
      data: timetable
    });
  } catch (error) {
    console.error('Get timetable error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving timetable'
    });
  }
};

/**
 * Get timetable by ID
 * @route GET /api/timetable/:id
 */
export const getTimetableById = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('subject', 'name code')
      .populate('faculty', 'designation')
      .populate('faculty.user', 'name email');
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: timetable
    });
  } catch (error) {
    console.error('Get timetable error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving timetable entry'
    });
  }
};

/**
 * Create new timetable entry
 * @route POST /api/timetable
 */
export const createTimetable = async (req, res) => {
  try {
    const { department, semester, day, subject, faculty, timeSlot } = req.body;

    if (!department || !semester || !day || !subject || !faculty || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: department, semester, day, subject, faculty, timeSlot'
      });
    }

    // Check if subject exists
    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if faculty exists
    const facultyDoc = await Faculty.findById(faculty);
    if (!facultyDoc) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    const timetable = await Timetable.create({
      department,
      semester,
      day,
      subject,
      faculty,
      timeSlot
    });

    const populatedTimetable = await Timetable.findById(timetable._id)
      .populate('subject', 'name code')
      .populate('faculty', 'designation')
      .populate('faculty.user', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Timetable entry created successfully',
      data: populatedTimetable
    });
  } catch (error) {
    console.error('Create timetable error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating timetable entry'
    });
  }
};

/**
 * Update timetable
 * @route PUT /api/timetable/:id
 */
export const updateTimetable = async (req, res) => {
  try {
    const { subject, faculty } = req.body;
    
    // If subject or faculty is being updated, validate them
    if (subject) {
      const subjectDoc = await Subject.findById(subject);
      if (!subjectDoc) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }
    }

    if (faculty) {
      const facultyDoc = await Faculty.findById(faculty);
      if (!facultyDoc) {
        return res.status(404).json({
          success: false,
          message: 'Faculty not found'
        });
      }
    }

    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('subject', 'name code')
     .populate('faculty', 'designation')
     .populate('faculty.user', 'name email');

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Timetable entry updated successfully',
      data: timetable
    });
  } catch (error) {
    console.error('Update timetable error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating timetable entry'
    });
  }
};

/**
 * Delete timetable
 * @route DELETE /api/timetable/:id
 */
export const deleteTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndDelete(req.params.id);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Timetable entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete timetable error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting timetable entry'
    });
  }
};
