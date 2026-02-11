import mongoose from 'mongoose';

const academicYearSchema = new mongoose.Schema(
  {
    year: { type: String, required: true, unique: true } // 2024-2025
  },
  { timestamps: true }
);

export default mongoose.model('AcademicYear', academicYearSchema);
