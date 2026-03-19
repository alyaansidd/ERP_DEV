// models/Notice.js
import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    targetRole: {
      type: String,
      enum: ['all', 'student', 'faculty', 'hod'],
      default: 'all'
    }
  },
  { timestamps: true }
);

export default mongoose.model('Notice', noticeSchema);
