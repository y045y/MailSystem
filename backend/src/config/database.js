// 📁 src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mssql',
  port: process.env.DB_PORT,
  logging: false,
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true,
      timezone: 'Asia/Tokyo', // 追加
    },
  },
  timezone: '+09:00', // SequelizeのDATE型に影響
});

module.exports = sequelize; // ✅ ここが大事！
