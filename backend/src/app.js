import express from 'express';
import cors from 'cors';
import { registerRoutes } from './routes/index.js';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

registerRoutes(app);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

export default app;
