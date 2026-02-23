import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    hod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty"
    },

    facultyIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty"
    }],

    classIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class"
    }]
  },
  { timestamps: true }
);

export default mongoose.model("Department", departmentSchema);
