// 📁 src/controllers/clientController.js
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const Client = require('../models/Client');
const Company = require('../models/Company'); // リレーション先
const Mail = require('../models/Mail'); // ← mailsテーブルのモデル

// ✅ 取引先一覧取得（GET /clients）
exports.getClients = async (req, res) => {
  try {
    const clients = await Client.findAll({
      include: [
        {
          model: Company,
          as: 'withdrawal_company',
          attributes: ['bank_name', 'bank_account'],
        },
      ],
      order: [['id', 'ASC']],
    });

    res.json(clients);
  } catch (err) {
    console.error('❌ 取引先一覧取得失敗:', err);
    res.status(500).json({ error: '取引先一覧取得に失敗しました', details: err.message });
  }
};
// ✅ 特定の取引先を取得（GET /clients/:id）
exports.getClientById = async (req, res) => {
  try {
    const id = req.params.id;
    const client = await Client.findByPk(id);

    if (!client) {
      return res.status(404).json({ error: 'クライアントが見つかりません' });
    }

    res.json(client);
  } catch (err) {
    console.error('❌ クライアント取得失敗:', err);
    res.status(500).json({ error: 'クライアント取得に失敗しました', details: err.message });
  }
};

// ✅ 取引先登録（POST /clients）
exports.createClient = async (req, res) => {
  try {
    const { name, bank_name, bank_account, withdrawal_company_id } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: '取引先名は必須です' });
    }

    const newClient = await Client.create({
      name,
      bank_name: bank_name || null,
      bank_account: bank_account || null,
      withdrawal_company_id: withdrawal_company_id !== '' ? Number(withdrawal_company_id) : null,
    });

    res.status(201).json(newClient);
  } catch (err) {
    console.error('❌ 取引先作成失敗:', err);
    res.status(500).json({ error: '取引先の登録に失敗しました', details: err.message });
  }
};


// ✅ 取引先更新（PUT /clients/:id）
exports.updateClient = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: '不正なIDです' });
  }

  const { name, bank_name, bank_account, withdrawal_company_id } = req.body;

  try {
    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({ error: '指定された取引先が見つかりません' });
    }

    await client.update({
      name,
      bank_name: bank_name || null,
      bank_account: bank_account || null,
      withdrawal_company_id: withdrawal_company_id || null,
    });

    res.json({ success: true, message: '更新が完了しました', client });
  } catch (err) {
    console.error('❌ 取引先更新失敗:', err);
    res.status(500).json({ error: '取引先の更新に失敗しました', details: err.message });
  }
};

exports.deleteClient = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: '不正なIDです' });
  }

  try {
    // ✅ クライアントが存在するか確認
    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({ error: '削除対象の取引先が見つかりませんでした' });
    }

    // ✅ mails テーブルの client_id を NULL に更新（外部キー制約回避）
    await Mail.update(
      { client_id: null },
      { where: { client_id: id } }
    );

    // ✅ 取引先削除
    await client.destroy();

    res.json({ success: true, message: '取引先を削除しました' });
  } catch (err) {
    console.error('❌ 取引先削除失敗:', err);
    res.status(500).json({
      error: '取引先の削除に失敗しました',
      details: err.message,
    });
  }
};
