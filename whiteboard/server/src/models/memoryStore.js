// In-memory store — used when MongoDB is not configured
// Format: { [roomId]: { roomId, name, createdBy, strokes: [], activeUsers: [] } }
const rooms = new Map();

function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

function createRoom(roomId, name, createdBy) {
  const room = { roomId, name, createdBy, strokes: [], activeUsers: [] };
  rooms.set(roomId, room);
  return room;
}

function addStroke(roomId, stroke) {
  const room = rooms.get(roomId);
  if (!room) return;
  if (stroke.type === 'clear') {
    room.strokes = [];
  } else {
    room.strokes.push(stroke);
  }
}

function roomExists(roomId) {
  return rooms.has(roomId);
}

module.exports = { getRoom, createRoom, addStroke, roomExists };
