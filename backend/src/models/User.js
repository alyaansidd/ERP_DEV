import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    phoneNo: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      match: [/^[0-9]{10}$/, 'Phone number must be 10 digits']
    },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'student', 'faculty', 'hod']
    },
    aadharNo: {
      type: String,
      required: [true, 'Aadhar number is required'],
      unique: true,
      match: [/^[0-9]{12}$/, 'Aadhar must be 12 digits']
    },
    dob: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email']
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false
    },
    passwordResetOtp: {
      type: String,
      select: false
    },
    passwordResetOtpExpires: {
      type: Date,
      select: false
    }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to exclude sensitive fields
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
