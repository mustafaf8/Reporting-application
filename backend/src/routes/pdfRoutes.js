const express = require('express');
const router = express.Router();

const { generateProposalPdf } = require('../controllers/pdfController');

router.post('/generate-pdf', generateProposalPdf);

module.exports = router;


