const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Company = require('./Company');

const CashRecord = sequelize.define(
  'CashRecord',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Company,
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    balance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'cash_records',
    timestamps: false,
  }
);

// ✅ リレーション設定（会社情報をJOIN可能に）
CashRecord.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

module.exports = CashRecord;