const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Client = require('./Client');
const Company = require('./Company');
const BankAccount = require('./BankAccount');

const Mail = sequelize.define('Mail', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  received_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Client,
      key: 'id',
    },
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  bank_account_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Company,
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  note: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "未処理",
  },
  created_at: {  // 修正: created_at を明示的に追加
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'mails',
  timestamps: false, // `created_at` は手動で定義
});

// 関連付け
Mail.belongsTo(Client, { foreignKey: 'client_id' });
Mail.belongsTo(BankAccount, { foreignKey: 'bank_account_id' });

module.exports = Mail;
