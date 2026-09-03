import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import v1Routes from './routes/v1/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { connectDB } from './db/connect.js';
import { db } from './db/store.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for client development
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());

// API v1 Routing
app.use('/api/v1', v1Routes);

// Health check root
app.get('/', (_req, res) => {
  res.json({
    name: 'AgencySync API Server',
    version: '1.0.0',
    status: 'online',
    designSystem: 'Notepad Minimal'
  });
});

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, async () => {
  await connectDB();
  await db.initDb();
  console.log(`🚀 AgencySync Server running at http://localhost:${PORT}`);
  console.log(`📁 API V1 Base URL: http://localhost:${PORT}/api/v1`);
});
