const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// モデルの定義
const Client = require('./Client');
const Company = require('./Company');

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
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  bank_account: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
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
    defaultValue: '未処理',
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Client,
      key: 'id',
    },
  },
  bank_account_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Company,
      key: 'id',
    },
  },
}, {
  tableName: 'mails',
  timestamps: false,
});

// リレーションの定義
Mail.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });
Mail.belongsTo(Company, { foreignKey: 'bank_account_id', as: 'company_account' });

module.exports = Mail;
