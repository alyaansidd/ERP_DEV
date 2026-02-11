import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // CSE-A
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    semester: Number,
    academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' }
  },
  { timestamps: true }
);

export default mongoose.model('Class', classSchema);
