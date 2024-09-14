const Request = require('../models/requestModel');
const Product = require('../models/productModel');

const handleWebhook = async (req, res) => {
    try {
        const { requestId } = req.body;

        const request = await Request.findOne({ requestId });
        if (!request) {
            return res.status(404).json({ error: 'Request ID not found' });
        }

        request.status = 'completed';
        request.completedAt = Date.now();
        await request.save();

        await Product.updateMany({ requestId }, { status: 'completed' });

        //We can implement other notification here as it was not mentioned is assignment to do anything
        res.status(200).json({ message: 'Webhook processed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { handleWebhook };
