const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // sequelizeインスタンスをインポート

// Company モデルの定義
const Company = sequelize.define('Company', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,  // 必須フィールド
  },
  bank_name: {
    type: DataTypes.STRING,
    allowNull: true,  // 任意フィールド
  },
  bank_account: {
    type: DataTypes.STRING,
    allowNull: true,  // 任意フィールド
  },
}, {
  tableName: 'company_master',  // テーブル名を指定
  timestamps: true,  // created_at と updated_at を自動で管理
  createdAt: 'created_at',  // カスタムフィールド名
  updatedAt: 'updated_at',  // カスタムフィールド名
});

// Company モデルをエクスポート
module.exports = Company;
