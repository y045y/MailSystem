const { Sequelize } = require("sequelize");
const sequelize = require("../config/database");
const Mail = require("../models/Mail");  // ← これを追加

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
        @sender=:sender, 
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
          sender: req.body.sender,
          client_id: req.body.client_id || 1,
          type: req.body.type,
          payment_date: formatDate(req.body.payment_date),
          bank_account_id: req.body.bank_account_id || null,
          amount: req.body.amount,
          description: req.body.description || null,
          note: req.body.note || null,
          status: req.body.status || "未処理",
          created_at: formatDateTime(new Date()), // 現在日時
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
