import mongoose from "mongoose";

const attendanceEntrySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  status: {
    type: String,
    enum: ["P", "A"],
    required: true
  }
}, { _id: false });

const attendanceSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true
    },

    lectureNo: {
      type: String,
      required: true,
      trim: true
    },

    date: {
      type: Date,
      required: true
    },

    record: [attendanceEntrySchema]
  },
  { timestamps: true }
);

// Prevent duplicate attendance for same class + subject + lecture + date
attendanceSchema.index(
  { classId: 1, subjectId: 1, lectureNo: 1, date: 1 },
  { unique: true }
);

export default mongoose.model("Attendance", attendanceSchema);
