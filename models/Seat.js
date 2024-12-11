const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    row: { type: String, required: true },
    number: { type: String, required: true },
    status: { type: String, default: 'available' },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
});

module.exports = mongoose.model('Seat', seatSchema);
