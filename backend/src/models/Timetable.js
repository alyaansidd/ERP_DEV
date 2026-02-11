// models/Timetable.js
import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true
    },
    semester: {
      type: Number,
      required: true
    },
    day: {
      type: String,
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      required: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true
    },
    timeSlot: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Timetable', timetableSchema);
