const express = require("express");
const router = express.Router();

// mailControllerをインポート
const mailController = require("../controllers/mailController");

const {
  createMail,
  getMails,
  getTransferList,
  getWithdrawalList,
  getNoticeList,
  getOtherList,
  getTransferListByMonth
} = mailController;  // 必要なメソッドを個別にインポート


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

// 郵便物修正エンドポイント
router.put('/:id', mailController.updateMail);

// 削除エンドポイント（DELETE）
router.delete('/:id', mailController.deleteMail);

router.get('/:month', getTransferListByMonth);

module.exports = router;
