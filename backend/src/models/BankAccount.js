const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Client = require('./Client');

const BankAccount = sequelize.define('BankAccount', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('client', 'company'),
    allowNull: false,
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Client,
      key: 'id'
    }
  }
}, {
  tableName: 'bank_accounts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

BankAccount.belongsTo(Client, { foreignKey: 'client_id' });
Client.hasMany(BankAccount, { foreignKey: 'client_id' });

module.exports = BankAccount;
