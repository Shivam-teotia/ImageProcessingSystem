const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    requestId: { type: String, required: true, unique: true },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
});

module.exports = mongoose.model('Request', requestSchema);
