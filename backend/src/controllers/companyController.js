const Company = require('../models/Company');
const Client = require('../models/Client');
const { Op } = require('sequelize');

// ✅ 自社口座一覧を取得 (GET /company-master)
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll({
      order: [['id', 'ASC']],
    });
    res.status(200).json(companies);
  } catch (error) {
    console.error('❌ Error fetching companies:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// ✅ 新規自社口座を登録 (POST /company-master)
exports.createCompany = async (req, res) => {
  try {
    const { bank_name, bank_account } = req.body;

    if (!bank_name || !bank_account) {
      return res.status(400).json({ error: 'bank_name と bank_account は必須です' });
    }

    const newCompany = await Company.create({
      bank_name,
      bank_account,
      created_at: new Date(), // ← これでOK。ISO文字列に変換しないこと。
      updated_at: new Date(),
    });

    res.status(201).json(newCompany);
  } catch (error) {
    console.error('❌ Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company', details: error.message });
  }
};

// ✅ 自社口座情報を更新 (PUT /company-master/:id)
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { bank_name, bank_account } = req.body;

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    company.bank_name = bank_name || company.bank_name;
    company.bank_account = bank_account || company.bank_account;
    company.updated_at = new Date();

    await company.save();
    res.status(200).json(company);
  } catch (error) {
    console.error('❌ Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company', details: error.message });
  }
};

// ✅ 自社口座を削除 (DELETE /company-master/:id)
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // 🔁 関連するclient_masterの外部キーをnullにする
    await Client.update({ withdrawal_company_id: null }, { where: { withdrawal_company_id: id } });

    await company.destroy();

    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting company:', error);
    res.status(500).json({ error: 'Failed to delete company', details: error.message });
  }
};
