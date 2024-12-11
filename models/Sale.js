const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    seatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    amount: { type: Number, required: true }, // Precio de la boleta
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Sale', saleSchema);
