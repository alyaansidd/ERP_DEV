import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    subjectCode: {
      type: String,
      required: true,
      unique: true
    },

    name: {
      type: String,
      required: true
    },

    credit: {
      type: Number,
      required: true,
      min: 1,
      max: 6
    }
  },
  { timestamps: true }
);

export default mongoose.model("Subject", subjectSchema);
