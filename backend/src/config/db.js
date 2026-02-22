import mongoose from 'mongoose';

const resolveMongoUri = () => {
  return process.env.MONGO_URI || process.env.MONGODB_URI || '';
};

const connectDB = async () => {
  const mongoUri = resolveMongoUri();

  if (!mongoUri) {
    console.error('MongoDB connection string missing. Set MONGO_URI or MONGODB_URI in .env');
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });

    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    return false;
  }
};

export default connectDB;
