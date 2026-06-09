const mongoose = require('mongoose');
const memStore = require('../models/memoryStore');

// Active socket rooms: Map<roomId, Map<socketId, { userId, username, color, cursor }>>
const activeRooms = new Map();

// Throttle helper — only forward cursor moves at most every N ms
function throttle(fn, delay) {
  const lastCall = new Map();
  return function (socketId, ...args) {
    const now = Date.now();
    const prev = lastCall.get(socketId) || 0;
    if (now - prev >= delay) {
      lastCall.set(socketId, now);
      fn(socketId, ...args);
    }
  };
}

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

async function getRoomModel() {
  if (!isMongoConnected()) return null;
  try {
    return require('../models/Room');
  } catch (_) {
    return null;
  }
}

async function persistStroke(roomId, stroke) {
  const Room = await getRoomModel();
  if (Room) {
    if (stroke.type === 'clear') {
      await Room.updateOne({ roomId }, { $set: { strokes: [] } });
    } else {
      await Room.updateOne({ roomId }, { $push: { strokes: stroke } });
    }
  } else {
    memStore.addStroke(roomId, stroke);
  }
}

function getRoomUsers(roomId) {
  const room = activeRooms.get(roomId);
  if (!room) return [];
  return Array.from(room.values()).map(({ userId, username, color }) => ({ userId, username, color }));
}

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9',
];

function assignColor(index) {
  return USER_COLORS[index % USER_COLORS.length];
}

module.exports = function setupSocketHandlers(io) {
  let userIndex = 0;

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── join-room ──────────────────────────────────────────────────────────────
    socket.on('join-room', async ({ roomId, username }) => {
      if (!roomId || !username) return;

      // Verify room exists
      let room;
      const Room = await getRoomModel();
      if (Room) {
        room = await Room.findOne({ roomId }).lean();
      } else {
        room = memStore.getRoom(roomId);
      }

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.username = username;

      const userId = socket.id;
      const color = assignColor(userIndex++);

      if (!activeRooms.has(roomId)) activeRooms.set(roomId, new Map());
      activeRooms.get(roomId).set(socket.id, { userId, username, color, cursor: null });

      // Send existing canvas state to the joining user
      socket.emit('canvas-state', { strokes: room.strokes || [] });

      // Notify everyone about updated user list
      const users = getRoomUsers(roomId);
      io.to(roomId).emit('users-update', { users });

      // Tell others someone joined
      socket.to(roomId).emit('user-joined', { userId, username, color });

      console.log(`👤 ${username} joined room ${roomId}`);
    });

    // ── draw ──────────────────────────────────────────────────────────────────
    socket.on('draw', async (strokeData) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      // Broadcast to everyone else in the room
      socket.to(roomId).emit('draw', strokeData);

      // Persist stroke (fire-and-forget)
      if (strokeData.points && strokeData.points.length > 0) {
        persistStroke(roomId, {
          type: 'stroke',
          points: strokeData.points,
          color: strokeData.color,
          width: strokeData.width,
          userId: socket.id,
        }).catch(console.error);
      }
    });

    // ── clear-canvas ──────────────────────────────────────────────────────────
    socket.on('clear-canvas', async () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      io.to(roomId).emit('clear-canvas');
      persistStroke(roomId, { type: 'clear' }).catch(console.error);
      console.log(`🗑️  Canvas cleared in room ${roomId}`);
    });

    // ── cursor-move (throttled at handler level) ───────────────────────────────
    const handleCursorMove = throttle((socketId, { x, y, roomId, username, color }) => {
      socket.to(roomId).emit('cursor-move', { userId: socketId, x, y, username, color });
    }, 50); // ~20fps max for cursors

    socket.on('cursor-move', ({ x, y }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const roomData = activeRooms.get(roomId);
      const user = roomData?.get(socket.id);
      if (!user) return;

      handleCursorMove(socket.id, { x, y, roomId, username: user.username, color: user.color });
    });

    // ── disconnect ─────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const roomData = activeRooms.get(roomId);
      if (roomData) {
        roomData.delete(socket.id);
        if (roomData.size === 0) activeRooms.delete(roomId);
      }

      const users = getRoomUsers(roomId);
      io.to(roomId).emit('users-update', { users });
      io.to(roomId).emit('user-left', { userId: socket.id, username: socket.data.username });

      console.log(`👋 ${socket.data.username} left room ${roomId}`);
    });
  });
};
