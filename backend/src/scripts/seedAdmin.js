/**
 * Seed the first admin user into the database.
 * Run once: node src/scripts/seedAdmin.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const ADMIN = {
  name: 'Super Admin',
  email: process.env.ADMIN_EMAIL || 'admin@college.com',
  password: process.env.ADMIN_PASSWORD || 'Admin@123',
  role: 'admin',
  phoneNo: '9999999999',
  aadharNo: '999999999999',
  dob: new Date('1990-01-01'),
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const exists = await User.findOne({ email: ADMIN.email });
    if (exists) {
      console.log(`Admin already exists (${ADMIN.email}). Skipping.`);
    } else {
      await User.create(ADMIN);
      console.log(`Admin created → ${ADMIN.email} / ${ADMIN.password}`);
    }
  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
};

seed();
