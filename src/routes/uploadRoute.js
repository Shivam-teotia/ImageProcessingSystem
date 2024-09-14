const express = require('express');
const { upload, uploadCSV, exportCSV } = require('../controllers/uploadController');
const router = express.Router();

router.post('/upload', upload.single('file'), uploadCSV);
router.get('/export/:requestId', exportCSV);
module.exports = router;
