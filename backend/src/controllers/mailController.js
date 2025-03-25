const { Sequelize } = require("sequelize");
const sequelize = require("../config/database");
const Mail = require("../models/Mail"); 
const Client = require('../models/Client');
const BankAccount = require('../models/BankAccount');

// 📌 日付を適切なフォーマットに変換する関数
const formatDateTime = (dateStr) => {
  if (!dateStr) return new Date().toISOString().slice(0, 19).replace("T", " ");
  return new Date(dateStr).toISOString().slice(0, 19).replace("T", " ");
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toISOString().split("T")[0]; // YYYY-MM-DD
};

// 📌 郵便物を登録 (POST /mails)
exports.createMail = async (req, res) => {
  try {
    console.log("📩 Received Data:", req.body);

    // ストアドプロシージャを実行
    const result = await sequelize.query(
      `EXEC InsertMailRecord 
        @received_at=:received_at, 
        @client_id=:client_id, 
        @type=:type, 
        @payment_date=:payment_date, 
        @bank_account_id=:bank_account_id, 
        @amount=:amount, 
        @description=:description, 
        @note=:note, 
        @status=:status, 
        @created_at=:created_at`,
      {
        replacements: {
          received_at: formatDateTime(req.body.received_at),
          client_id: req.body.client_id || 1,
          type: req.body.type,
          payment_date: formatDate(req.body.payment_date),
          bank_account_id: req.body.bank_account_id || null,
          amount: req.body.amount,
          description: req.body.description || null,
          note: req.body.note || null,
          status: req.body.status || "未処理",
          created_at: formatDateTime(new Date())
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    
    console.log("✅ Insert Success:", result);
    res.status(201).json({ success: true, insertedId: result[0]?.new_id || null });
  } catch (error) {
    console.error("❌ Error creating mail:", error);
    res.status(500).json({
      error: "Database Insertion Failed",
      details: error.message,
    });
  }
};



// 📩 郵便物一覧を取得 (GET /mails)
exports.getMails = async (req, res) => {
  try {
    const mails = await Mail.findAll();
    res.status(200).json(mails);
  } catch (error) {
    console.error("❌ Error fetching mails:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message
    });
  }
};

exports.getMails = async (req, res) => {
  try {
    const mails = await Mail.findAll({
      include: [
        { model: Client },
        { model: BankAccount }
      ],
      order: [['received_at', 'DESC']]
    });
    res.json(mails);
  } catch (error) {
    res.status(500).json({ error: "一覧取得失敗" });
  }
};

// 振込一覧取得
// 振込一覧取得（日付範囲指定バージョン）
exports.getTransferList = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate と endDate は必須です' });
  }

  try {
    const results = await sequelize.query(
      `SELECT
        m.payment_date,
        m.type,
        c.name AS client_name,
        m.amount,
        b.name AS bank_account_name,
        m.description,
        m.note
      FROM mails m
      LEFT JOIN client_master c ON m.client_id = c.id
      LEFT JOIN bank_accounts b ON m.bank_account_id = b.id
      WHERE m.type = '振込'
        AND m.payment_date BETWEEN :startDate AND :endDate
      ORDER BY c.name ASC, m.payment_date`,
      {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: '一覧取得失敗', detail: err.message });
  }
};

// 引落一覧取得（日付範囲指定対応）
exports.getWithdrawalList = async (req, res) => {
  const { startDate, endDate } = req.query;

  // startDate または endDate がない場合は 400 Bad Request
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate と endDate は必須です' });
  }

  try {
    const results = await sequelize.query(
      `SELECT
        m.payment_date,
        m.type,
        c.name AS client_name,
        m.amount,
        b.name AS bank_account_name,
        m.description,
        m.note
      FROM mails m
      LEFT JOIN client_master c ON m.client_id = c.id
      LEFT JOIN bank_accounts b ON m.bank_account_id = b.id
      WHERE m.type = '引落'
        AND m.payment_date BETWEEN :startDate AND :endDate
      ORDER BY c.name ASC, m.payment_date`,
      {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json(results);
  } catch (err) {
    console.error('引落一覧取得失敗:', err);
    res.status(500).json({ error: '引落一覧取得失敗', detail: err.message });
  }
};
// 通知一覧取得（日付範囲指定）
exports.getNoticeList = async (req, res) => {
  const { startDate, endDate } = req.query;

  // バリデーション
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate と endDate は必須です' });
  }

  try {
    const results = await sequelize.query(
      `
      SELECT
        m.received_at,
        m.type,
        c.name AS client_name,
        m.description,
        m.note
      FROM mails m
      LEFT JOIN client_master c ON m.client_id = c.id
      WHERE m.type = '通知'
        AND m.received_at BETWEEN :startDate AND :endDate
      ORDER BY m.received_at ASC
      `,
      {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json(results);
  } catch (err) {
    console.error('通知一覧の取得に失敗:', err);
    res.status(500).json({
      error: '通知一覧の取得に失敗しました',
      detail: err.message,
    });
  }
};

// その他一覧取得（日付範囲指定）
exports.getOtherList = async (req, res) => {
  const { startDate, endDate } = req.query;

  // バリデーション
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate と endDate は必須です' });
  }

  try {
    const results = await sequelize.query(
      `
      SELECT
        m.received_at,
        m.type,
        c.name AS client_name,
        m.description,
        m.note
      FROM mails m
      LEFT JOIN client_master c ON m.client_id = c.id
      WHERE m.type = 'その他'
        AND m.received_at BETWEEN :startDate AND :endDate
      ORDER BY m.received_at ASC
      `,
      {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json(results);
  } catch (err) {
    console.error('その他一覧の取得に失敗:', err);
    res.status(500).json({
      error: 'その他一覧の取得に失敗しました',
      detail: err.message,
    });
  }
};
