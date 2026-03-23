const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const attendanceRoutes = require('./routes/attendanceRoutes');
const userRoutes = require('./routes/userRoutes');
const { initSocketHandler } = require('./sockets/socketHandler');
const { scheduleDailyReset } = require('./services/dailyResetService');

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Make io accessible in route handlers via req.app.get('io')
app.set('io', io);

// API Routes
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Socket.io event handlers
initSocketHandler(io);

// Schedule daily absent-marking at 23:59 every night
scheduleDailyReset(io);

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/face_attendance')
  .then(() => {
    console.log('[MongoDB] Connected successfully');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[MongoDB] Connection error:', err.message);
    process.exit(1);
  });
