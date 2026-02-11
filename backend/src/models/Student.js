import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rollNo: { type: String, required: true, unique: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    semester: Number,
    admissionYear: Number
  },
  { timestamps: true }
);

export default mongoose.model('Student', studentSchema);