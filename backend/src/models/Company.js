const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define('Company', {
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
  created_at: {
    type: DataTypes.STRING, // datetime ではなく文字列として受け取る
    allowNull: true,
    defaultValue: null,
  },
  updated_at: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'company_master',
  timestamps: false, // Sequelizeの自動タイムスタンプ機能は使わない
});

module.exports = Company;
