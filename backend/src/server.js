import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';

dotenv.config();
const startServer = async () => {
  try {
    const isConnected = await connectDB();
    if (!isConnected) {
      console.error('Database connection failed. Exiting...');
      process.exit(1);
    }

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server gracefully...');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Closing server gracefully...');
  mongoose.connection.close();
  process.exit(0);
});

startServer();
