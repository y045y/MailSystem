const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Company = require('./Company'); // 🔁 外部キー先のCompanyをインポート

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  bank_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bank_account: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  withdrawal_company_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Company,
      key: 'id',
    },
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'client_master',
  timestamps: false,
});

// 🔁 リレーション（取引先は1つの自社口座と紐づく）
Client.belongsTo(Company, {
  foreignKey: 'withdrawal_company_id',
  as: 'withdrawal_company',
});

module.exports = Client;
