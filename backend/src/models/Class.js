import mongoose from "mongoose";

const classLectureSchema = new mongoose.Schema({
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty"
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject"
  }
}, { _id: false });

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true
    },

    coordinatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty"
    },

    roomNo: {
      type: String,
      trim: true
    },

    semester: {
      type: Number,
      required: true,
      min: 1
    },

    studentIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student"
    }],

    timeTable: {
      type: Map,
      of: {
        type: Map,
        of: classLectureSchema
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Class", classSchema);
