const express = require("express");
const router = express.Router();

const {
  createClient,
  getClients,
  getClientById,       // ✅ 追加：1件取得
  updateClient,
  deleteClient,
} = require("../controllers/clientsController");

// ✅ 一覧取得（GET /clients）
router.get("/", getClients);

// ✅ 1件取得（GET /clients/:id）
router.get("/:id", getClientById); // ← 追加！

// ✅ 新規登録（POST /clients）
router.post("/", createClient);

// ✅ 修正（PUT /clients/:id）
router.put("/:id", updateClient);

// ✅ 削除（DELETE /clients/:id）
router.delete("/:id", deleteClient);

module.exports = router;
