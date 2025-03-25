const express = require("express");
const router = express.Router();

const {
  createMail,
  getMails,
  getTransferList,
  getWithdrawalList,
  getNoticeList,
  getOtherList
} = require("../controllers/mailController");

// 郵便物を新規登録
router.post("/", createMail);

// 郵便物一覧を取得（全件取得など）
router.get("/", getMails);

// 振込一覧（type = '振込'）
router.get("/transfers", getTransferList);

// 引落一覧（type = '引落'）
router.get("/withdrawals", getWithdrawalList);

// 通知一覧（type = '通知'）
router.get("/notices", getNoticeList);

// その他一覧（type = 'その他'）
router.get("/others", getOtherList);

module.exports = router;
