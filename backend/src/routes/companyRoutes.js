const express = require('express');
const router = express.Router();
const {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} = require('../controllers/companyController');

// ✅ 自社マスタ一覧を取得（GET /company-master）
router.get('/', getCompanies);

// ✅ 新規自社口座を登録（POST /company-master）
router.post('/', createCompany);

// ✅ 自社口座情報を更新（PUT /company-master/:id）
router.put('/:id', updateCompany);

// ✅ 自社口座を削除（DELETE /company-master/:id）
router.delete('/:id', deleteCompany);

module.exports = router;
