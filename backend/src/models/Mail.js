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

  // ✅ 受取日（文字列 "YYYY-MM-DD" にしたいので DATEONLY にする）
  received_at: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },

  // 振込・引落・通知・その他
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  // 支払期限・引落日（DATEONLYでフォーマット揃える）
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },

  // 旧仕様の名残（使わない場合は消してOK）
  bank_account: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // 金額
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },

  // 説明文
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // メモ欄
  note: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // ステータス（未処理／済）
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '未処理',
  },

  // 登録日時（必要に応じて）
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },

  // 外部キー：取引先ID
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Client,
      key: 'id',
    },
  },

  // 外部キー：会社口座ID（company_masterのID）
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
