import AcademicYear from '../models/AcedemicYear.js';

export const getAllAcademicYears = async (req, res) => {
  try {
    const academicYears = await AcademicYear.find();
    res.status(200).json({
      success: true,
      count: academicYears.length,
      data: academicYears
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving academic years'
    });
  }
};

export const getAcademicYearById = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findById(req.params.id);
    if (!academicYear) {
      return res.status(404).json({
        success: false,
        message: 'Academic year not found'
      });
    }
    res.status(200).json({
      success: true,
      data: academicYear
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving academic year'
    });
  }
};

export const createAcademicYear = async (req, res) => {
  try {
    const { year } = req.body;
    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Please provide academic year'
      });
    }
    const academicYear = await AcademicYear.create({ year });
    res.status(201).json({
      success: true,
      message: 'Academic year created successfully',
      data: academicYear
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating academic year'
    });
  }
};

export const updateAcademicYear = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!academicYear) {
      return res.status(404).json({
        success: false,
        message: 'Academic year not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Academic year updated successfully',
      data: academicYear
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating academic year'
    });
  }
};

export const deleteAcademicYear = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findByIdAndDelete(req.params.id);
    if (!academicYear) {
      return res.status(404).json({
        success: false,
        message: 'Academic year not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Academic year deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting academic year'
    });
  }
};
