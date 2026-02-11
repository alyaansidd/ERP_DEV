import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    semester: Number,
    credits: Number
  },
  { timestamps: true }
);

export default mongoose.model('Course', courseSchema);
