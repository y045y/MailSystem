const express = require('express');
const router = express.Router();
const {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} = require('../controllers/companyController');

// 会社一覧を取得 (GET /companies)
router.get('/', getCompanies);

// 新規会社を登録 (POST /companies)
router.post('/', createCompany);

// 会社情報を更新 (PUT /companies/:id)
router.put('/:id', updateCompany);

// 会社情報を削除 (DELETE /companies/:id)
router.delete('/:id', deleteCompany);

module.exports = router;
