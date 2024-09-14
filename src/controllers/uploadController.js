const multer = require('multer');
const csvParser = require('csv-parser');
const { Readable } = require('stream');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Request = require('../models/requestModel');
const Product = require('../models/productModel');
const { addToQueue } = require('../workers/imageProcessor');
const productModel = require('../models/productModel');

// Set up multer for in-memory file storage
const upload = multer({ storage: multer.memoryStorage() });

const uploadCSV = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'file is required' });
        }

        const requestId = uuidv4();
        const results = [];

        // Create a readable stream from the in-memory buffer
        const stream = Readable.from(file.buffer);

        stream
            .pipe(csvParser({ separator: ',', quote: '"' }))
            .on('data', (row) => {

                const serialNumberKey = Object.keys(row).find(key => key.includes('S.No'));
                const productNameKey = Object.keys(row).find(key => key.includes('Product Name'));
                const inputImageUrlsKey = Object.keys(row).find(key => key.includes('Input Image Urls'));

                const trimmedRow = {
                    serialNumber: serialNumberKey ? parseInt(row[serialNumberKey]?.trim(), 10) : null,
                    productName: productNameKey ? row[productNameKey]?.trim() : null,
                    inputImageUrls: inputImageUrlsKey ? row[inputImageUrlsKey]?.replace(/"/g, '').split(',').map((url) => url.trim()) : []
                };
                results.push(trimmedRow);
            })
            .on('end', async () => {
                if (!results.length || !results[0].productName || !results[0].inputImageUrls.length) {
                    return res.status(400).json({ error: 'Invalid CSV format' });
                }
                const request = new Request({ requestId });
                await request.save();

                // Save each product entry
                for (const row of results) {
                    if (!row.inputImageUrls.length || !row.productName) {
                        continue;
                    }

                    const product = new Product({
                        requestId,
                        serialNumber: row.serialNumber,
                        productName: row.productName,
                        inputImageUrls: row.inputImageUrls,
                        status: 'pending'
                    });

                    await product.save();
                }

                // Add job to in-memory queue
                addToQueue({ requestId });

                res.status(201).json({ requestId });
            });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//this function is to export csv in output folder
const exportCSV = async (req, res) => {
    const { requestId } = req.params;

    try {
        // Fetch processed data for the given request ID
        const products = await productModel.find({ requestId });
        if (!products.length) {
            return res.status(404).json({ message: 'No data found for this request ID.' });
        }

        // Define the path for the output CSV file
        const outputPath = path.join(__dirname, `../output/output-${requestId}.csv`);
        // Create a CSV writer
        const csvWriter = createCsvWriter({
            path: outputPath,
            header: [
                { id: 'serialNumber', title: 'S.No' },
                { id: 'productName', title: 'Product Name' },
                { id: 'inputImageUrls', title: 'Input Image Urls' },
                { id: 'outputImageUrls', title: 'Output Image Urls' },
            ],
        });
        // Format data for the CSV file
        const records = products.map((product) => {
            const inputUrls = product.inputImageUrls || [];

            return {
                serialNumber: product.serialNumber || '',
                productName: product.productName || '',
                inputImageUrls: inputUrls.join(','),
                outputImageUrls: inputUrls.join(','),
            };
        });

        // Write records to the CSV file
        await csvWriter.writeRecords(records);

        // Send the CSV file as a response
        res.download(outputPath, `output-${requestId}.csv`);
    } catch (error) {
        console.error('Error generating output CSV:', error);
        res.status(500).json({ message: 'Error generating output CSV' });
    }
};
module.exports = { upload, uploadCSV, exportCSV };
