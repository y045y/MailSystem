const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define(
  'Company',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    bank_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bank_account: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    account_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '流動', // 新規追加：流動／定期／積金などを分類
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'company_master',
    timestamps: false, // Sequelizeの自動生成を使わず、自分で管理
  }
);

module.exports = Company;
