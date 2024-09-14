const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    requestId: { type: String, required: true },
    serialNumber: { type: Number, required: true },
    productName: { type: String, required: true },
    inputImageUrls: [String],
    status: { type: String, default: 'pending' },
});

module.exports = mongoose.model('Product', productSchema);
