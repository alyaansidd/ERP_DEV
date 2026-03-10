import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    rollNo: {
      type: String,
      required: true,
      unique: true
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },

    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },

    fatherName: {
      type: String,
      required: true
    },

    fatherNo: {
      type: String,
      match: [/^[0-9]{10}$/, 'Invalid phone number']
    }
  },
  { timestamps: true }
);

export default mongoose.model('Student', studentSchema);
