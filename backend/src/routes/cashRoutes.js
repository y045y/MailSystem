const express = require('express');
const router = express.Router();
const cashController = require('../controllers/cashController');

// 一覧取得
router.get('/', cashController.getAllCashRecords);

// 登録
router.post('/', cashController.createCashRecord);

module.exports = router;
