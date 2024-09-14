const Request = require('../models/requestModel');
const Product = require('../models/productModel');

const checkStatus = async (req, res) => {
    try {
        const { requestId } = req.params;

        const request = await Request.findOne({ requestId });
        if (!request) {
            return res.status(404).json({ error: 'Request ID not found' });
        }

        const products = await Product.find({ requestId });
        const productData = products.map((product) => ({
            serialNumber: product.serialNumber,
            productName: product.productName,
            inputImageUrls: product.inputImageUrls,
            outputImageUrls: product.outputImageUrls,
            status: product.status,
        }));

        res.status(200).json({
            status: request.status,
            products: productData,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { checkStatus };
