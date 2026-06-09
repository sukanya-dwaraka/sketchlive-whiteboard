require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const roomRoutes = require('./routes/rooms');
const setupSocketHandlers = require('./socket/handlers');

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, 'http://localhost:5173', 'https://sketchlive-whiteboard-1.onrender.com'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: [FRONTEND_URL, 'http://localhost:5173', 'https://sketchlive-whiteboard-1.onrender.com'], credentials: true }));
app.use(express.json());

// Routes
app.use('/api/rooms', roomRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// MongoDB connection (graceful - app works without it)
const MONGO_URI = process.env.MONGO_URI || '';
if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.warn('⚠️  MongoDB not connected (running without persistence):', err.message));
} else {
  console.log('ℹ️  No MONGO_URI set — running in-memory mode (no persistence)');
}

// Socket.IO handlers
setupSocketHandlers(io);


const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Whiteboard server running on http://localhost:${PORT}`);
});
