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
