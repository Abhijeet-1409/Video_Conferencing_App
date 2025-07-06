// models/Room.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participant' }]
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
