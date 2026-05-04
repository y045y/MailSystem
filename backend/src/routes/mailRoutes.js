const express = require('express');
const router = express.Router();

const mailController = require('../controllers/mailController');

const {
  createMail,
  getMails,
  getTransferList,
  getWithdrawalList,
  getNoticeList,
  getOtherList,
  getTransferListByMonth,
  getWithdrawalListByMonth,
  getTransferAndWithdrawalSummary,
  updateMail,
  deleteMail,
  markAsPaid,
  markAsUnpaid,
} = mailController;

// 新規登録
router.post('/', createMail);

// 一覧
router.get('/', getMails);

// 種別別一覧
router.get('/transfers', getTransferList);
router.get('/withdrawals', getWithdrawalList);
router.get('/notices', getNoticeList);
router.get('/others', getOtherList);

// PDF・帳票系
router.get('/transfer-withdrawal-summary', getTransferAndWithdrawalSummary);
router.get('/transfer-list/:month', getTransferListByMonth);
router.get('/withdrawal-list/:month', getWithdrawalListByMonth);

// 状態変更
router.patch('/:id/mark-paid', markAsPaid);
router.patch('/:id/mark-unpaid', markAsUnpaid);

// 更新・削除
router.put('/:id', updateMail);
router.delete('/:id', deleteMail);

module.exports = router;
