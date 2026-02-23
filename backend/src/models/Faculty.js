import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class"
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject"
  }
}, { _id: false });

const facultySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    employeeNo: {
      type: String,
      required: true,
      unique: true
    },

    designation: {
      type: String,
      required: true
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true
    },

    joiningDate: {
      type: Date,
      required: true
    },

    routing: {
      type: Map,
      of: {
        type: Map,
        of: lectureSchema
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Faculty", facultySchema);