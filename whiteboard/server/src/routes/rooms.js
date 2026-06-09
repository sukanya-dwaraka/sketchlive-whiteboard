const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

let Room;
try {
  Room = require('../models/Room');
} catch (_) {}

const memStore = require('../models/memoryStore');

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

// POST /api/rooms/create
router.post('/create', async (req, res) => {
  const { username, name } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });

  const roomId = uuidv4().slice(0, 8).toUpperCase();

  try {
    if (isMongoConnected() && Room) {
      await Room.create({ roomId, name: name || `${username}'s Board`, createdBy: username, strokes: [] });
    } else {
      memStore.createRoom(roomId, name || `${username}'s Board`, username);
    }
    res.json({ roomId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// GET /api/rooms/:roomId
router.get('/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    let room;
    if (isMongoConnected() && Room) {
      room = await Room.findOne({ roomId }).lean();
    } else {
      room = memStore.getRoom(roomId);
    }

    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
