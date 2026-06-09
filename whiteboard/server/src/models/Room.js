const mongoose = require('mongoose');

const StrokeSchema = new mongoose.Schema({
  type: { type: String, enum: ['stroke', 'clear'], required: true },
  points: [{ x: Number, y: Number }],
  color: String,
  width: Number,
  userId: String,
  timestamp: { type: Date, default: Date.now },
});

const RoomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    createdBy: { type: String, required: true },
    strokes: [StrokeSchema],
    activeUsers: [
      {
        userId: String,
        username: String,
        color: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', RoomSchema);
