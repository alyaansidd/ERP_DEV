import mongoose from 'mongoose';

const sessionLocationSchema = new mongoose.Schema(
  {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  { _id: false }
);

const markedStudentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    markedAt: {
      type: Date,
      default: Date.now
    },
    distanceMeters: {
      type: Number,
      required: true,
      min: 0
    },
    studentLocation: {
      type: sessionLocationSchema,
      required: true
    }
  },
  { _id: false }
);

const attendanceSessionSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
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
    startedByFacultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    facultyLocation: {
      type: sessionLocationSchema,
      required: true
    },
    radiusMeters: {
      type: Number,
      required: true,
      min: 1
    },
    status: {
      type: String,
      enum: ['active', 'ended', 'expired', 'cancelled'],
      default: 'active'
    },
    markedStudents: [markedStudentSchema]
  },
  { timestamps: true }
);

attendanceSessionSchema.index({ classId: 1, subjectId: 1, lectureNo: 1, date: 1, status: 1 });
attendanceSessionSchema.index({ status: 1, endTime: 1 });

export default mongoose.model('AttendanceSession', attendanceSessionSchema);
