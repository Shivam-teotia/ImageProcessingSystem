const axios = require('axios');
const sharp = require('sharp');
const Product = require('../models/productModel');
const Request = require('../models/requestModel');

// In-memory queue
const jobQueue = [];

const addToQueue = (job) => {
    jobQueue.push(job);
};

const processQueue = async () => {
    if (jobQueue.length === 0) return;

    const job = jobQueue.shift();
    const { requestId } = job;

    try {
        const products = await Product.find({ requestId, status: 'pending' });

        for (const product of products) {
            const outputImageUrls = [];

            for (const url of product.inputImageUrls) {
                try {
                    const response = await axios.get(url, { responseType: 'arraybuffer' });
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    const compressedImageBuffer = await sharp(imageBuffer)
                        .jpeg({ quality: 50 })
                        .toBuffer();

                    // Simulate uploading to a storage service
                    const outputUrl = `https://storage-service/${product.productName}-${Date.now()}.jpg`;

                    outputImageUrls.push(outputUrl);
                } catch (imageProcessingError) {
                    console.error(`Error processing image for product ${product.productName}:`, imageProcessingError.message);
                }
            }

            // Update product output URLs and status
            product.outputImageUrls = outputImageUrls;
            product.status = 'completed';
            await product.save();
        }

        // Update request status to 'completed'
        const request = await Request.findOneAndUpdate(
            { requestId },
            { status: 'completed', completedAt: Date.now() }
        );

        // Trigger webhook after processing is completed
        // const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook';
        // await axios.post(webhookUrl, { requestId });

    } catch (error) {
        console.error('Error processing images:', error.message);

        await Request.findOneAndUpdate({ requestId }, { status: 'error', errorMessage: error.message });
    }
};

setInterval(processQueue, 5000);

module.exports = { addToQueue };
