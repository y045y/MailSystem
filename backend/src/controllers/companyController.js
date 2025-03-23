const Company = require('../models/Company');
const { Op } = require('sequelize');

// 会社一覧を取得 (GET /companies)
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll();
    res.status(200).json(companies);
  } catch (error) {
    console.error('❌ Error fetching companies:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// 新規会社を登録 (POST /companies)
exports.createCompany = async (req, res) => {
    try {
      const { name, bank_name, bank_account } = req.body;
  
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }
  
      // created_at と updated_at を手動で設定してタイムゾーン情報を削除
      const newCompany = await Company.create({
        name,
        bank_name,
        bank_account,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),  // タイムゾーンなしの日付形式に変換
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),  // タイムゾーンなしの日付形式に変換
      });
  
      res.status(201).json(newCompany);
    } catch (error) {
      console.error('❌ Error creating company:', error);
      res.status(500).json({ error: 'Failed to create company', details: error.message });
    }
  };
  
  
// 会社情報を更新 (PUT /companies/:id)
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bank_name, bank_account } = req.body;

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    company.name = name || company.name;
    company.bank_name = bank_name || company.bank_name;
    company.bank_account = bank_account || company.bank_account;

    await company.save();

    res.status(200).json(company);
  } catch (error) {
    console.error('❌ Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company', details: error.message });
  }
};

// 会社情報を削除 (DELETE /companies/:id)
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await company.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting company:', error);
    res.status(500).json({ error: 'Failed to delete company', details: error.message });
  }
};
