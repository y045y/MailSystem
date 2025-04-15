const express = require('express');
const router = express.Router();
const cashController = require('../controllers/cashRecordController');

router.get('/', cashController.getAllCashRecords);
router.post('/', cashController.createCashRecord);

// 🆕 更新・削除用エンドポイント
router.put('/:id', cashController.updateCashRecord);
router.delete('/:id', cashController.deleteCashRecord);

module.exports = router;
