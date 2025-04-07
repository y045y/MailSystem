const sequelize = require('../config/database');
const Client = require('./Client');
const BankAccount = require('./BankAccount');

// 🔗 リレーション定義（ここにまとめる！）
Client.belongsTo(BankAccount, {
  foreignKey: 'withdrawal_bank_account_id',
  as: 'withdrawalAccount',
});

BankAccount.belongsTo(Client, {
  foreignKey: 'client_id',
});
Client.hasMany(BankAccount, {
  foreignKey: 'client_id',
});

module.exports = {
  sequelize,
  Client,
  BankAccount,
};
