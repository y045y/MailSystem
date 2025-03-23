const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Client = sequelize.define('Client', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bank_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bank_account: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'client_master',
  timestamps: true,
  createdAt: 'created_at',  // データベースのカラム名に合わせる
  updatedAt: 'updated_at',  // データベースのカラム名に合わせる
});

module.exports = Client;
