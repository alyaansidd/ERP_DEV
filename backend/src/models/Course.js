import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    semester: { type: Number, required: true, min: 1 },
    credits: { type: Number, required: true, min: 1 }
  },
  { timestamps: true }
);

export default mongoose.model('Course', courseSchema);
