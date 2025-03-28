const BankAccount = require("../models/BankAccount");

exports.getClientAccounts = async (req, res) => {
  const { clientId } = req.params;
  try {
    const accounts = await BankAccount.findAll({
      where: { client_id: clientId, type: "client" }
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: "口座の取得に失敗しました。" });
  }
};

exports.getCompanyAccounts = async (req, res) => {
  try {
    const accounts = await BankAccount.findAll({
      where: { type: "company" }
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: "自社口座の取得に失敗しました。" });
  }
};

// 会社 or 取引先の口座を登録
exports.createBankAccount = async (req, res) => {
  try {
    const { name, type, client_id } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'nameとtypeは必須です' });
    }

    const newAccount = await BankAccount.create({
      name,
      type,
      client_id: type === 'client' ? client_id : null
    });

    res.status(201).json(newAccount);
  } catch (err) {
    console.error('❌ 登録失敗:', err);
    res.status(500).json({ error: '登録失敗', detail: err.message });
  }
};

