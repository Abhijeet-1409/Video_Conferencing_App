// models/Participant.js
const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  socketId: { type: String, required: true },
  userData: {
    type: mongoose.Schema.Types.Mixed, // ✅ allows any structure
    required: true
  },
  roomId: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Participant', participantSchema);