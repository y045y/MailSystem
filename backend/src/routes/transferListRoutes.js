// backend/src/routes/transferListRoutes.js

const express = require('express');
const router = express.Router();
const { getTransferListByMonth } = require('../controllers/transferListController');

// 例: GET /api/transfer-list/2025-04
router.get('/:month', getTransferListByMonth);

module.exports = router;
