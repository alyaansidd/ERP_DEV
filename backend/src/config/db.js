import mongoose from 'mongoose';

const resolveMongoUri = () => {
  return process.env.MONGO_URI || process.env.MONGODB_URI || '';
};

const dropLegacySubjectCodeIndex = async () => {
  try {
    const subjectsCollection = mongoose.connection.collection('subjects');
    const indexes = await subjectsCollection.indexes();
    const hasLegacyCodeIndex = indexes.some((index) => index?.name === 'code_1');

    if (!hasLegacyCodeIndex) {
      return;
    }

    await subjectsCollection.dropIndex('code_1');
    console.log('Dropped legacy index subjects.code_1');
  } catch (error) {
    // Non-fatal migration step: keep startup alive even if index cleanup fails.
    console.warn('Could not drop legacy subjects.code_1 index:', error.message);
  }
};

const dropLegacyStudentUserIndex = async () => {
  try {
    const studentsCollection = mongoose.connection.collection('students');
    const indexes = await studentsCollection.indexes();
    const hasLegacyUserIndex = indexes.some((index) => index?.name === 'user_1');

    if (!hasLegacyUserIndex) {
      return;
    }

    await studentsCollection.dropIndex('user_1');
    console.log('Dropped legacy index students.user_1');
  } catch (error) {
    // Non-fatal migration step: keep startup alive even if index cleanup fails.
    console.warn('Could not drop legacy students.user_1 index:', error.message);
  }
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

    await dropLegacySubjectCodeIndex();
    await dropLegacyStudentUserIndex();

    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    return false;
  }
};

export default connectDB;
