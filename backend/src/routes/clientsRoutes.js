const express = require("express");
const router = express.Router();
const { createClient, getClients } = require("../controllers/clientsController");

// 取引先一覧を取得 (GET /clients)
router.get("/", getClients);

// 新規取引先を登録 (POST /clients)
router.post("/", createClient);

module.exports = router;
