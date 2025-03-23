const express = require("express");
const router = express.Router();
const { createMail, getMails } = require("../controllers/mailController");

// 郵便物を新規登録
router.post("/", createMail);

// 郵便物一覧を取得
router.get("/", getMails);

module.exports = router;
