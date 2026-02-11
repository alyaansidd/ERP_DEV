import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Present', 'Absent'],
      default: 'Present'
    }
  },
  { timestamps: true }
);

export default mongoose.model('Attendance', attendanceSchema);
