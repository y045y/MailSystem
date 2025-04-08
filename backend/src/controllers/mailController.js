const { Sequelize } = require("sequelize");
const sequelize = require("../config/database");
const Mail = require("../models/Mail"); 
const Client = require('../models/Client');


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
        { model: Client }
      ],
      order: [['received_at', 'DESC']]
    });
    res.json(mails);
  } catch (error) {
    res.status(500).json({ error: "一覧取得失敗" });
  }
};


// 振込一覧取得API
exports.getTransferList = async (req, res) => {
  const { startDate, endDate } = req.query;

  // クエリパラメータがない場合は400エラー
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate と endDate は必須です' });
  }

  try {
    // 生SQLを使用して振込データを取得
    const results = await sequelize.query(
      `
      SELECT
        m.id,
        m.received_at,  -- ✅ 受取日も取得（画面でソートに使う）
        m.payment_date,
        m.type,
        c.name AS client_name,
        m.amount,
        -- 口座情報を1列にまとめて表示
        (c.bank_name + '（' + c.bank_account + '）') AS bank_account_name,
        m.description,
        m.note
      FROM mails m
      LEFT JOIN client_master c ON m.client_id = c.id
      WHERE m.type = '振込'
        AND m.payment_date BETWEEN :startDate AND :endDate
      ORDER BY m.received_at, c.name ASC, m.payment_date
      `,
      {
        replacements: {
          startDate,
          endDate,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // 成功時：JSONで返却
    res.status(200).json(results);
  } catch (err) {
    // エラー時：ログ出力 & 500エラー返却
    console.error("❌ Error in getTransferList:", err);
    res.status(500).json({
      error: '一覧取得失敗',
      detail: err.message,
    });
  }
};

// 引落一覧取得（日付範囲指定対応）
exports.getWithdrawalList = async (req, res) => {
  const { startDate, endDate } = req.query;

  // 🔍 バリデーション: startDate または endDate がない場合は 400
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate と endDate は必須です' });
  }

  try {
    const results = await sequelize.query(
      `SELECT
        m.id,                                        -- 郵便物ID
        m.payment_date,                              -- 支払日
        m.type,                                      -- 種別（引落）
        c.name AS client_name,                       -- 取引先名
        m.amount,                                    -- 金額
        (b.bank_name + '（' + b.bank_account + '）') AS bank_account_name,  -- 会社口座名（自社）
        m.description,                               -- 説明
        m.note                                       -- メモ
      FROM mails m
      LEFT JOIN client_master c ON m.client_id = c.id           -- 取引先情報
      LEFT JOIN company_master b ON m.bank_account_id = b.id    -- 自社口座情報
      WHERE m.type = '引落'
        AND m.payment_date BETWEEN :startDate AND :endDate
      ORDER BY c.name ASC, m.payment_date`,
      {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // ✅ 正常レスポンス返却
    res.json(results);
  } catch (err) {
    // ❌ エラー処理
    console.error('引落一覧取得失敗:', err);
    res.status(500).json({
      error: '引落一覧取得失敗',
      detail: err.message,
    });
  }
};


// 通知一覧取得（日付範囲指定）
exports.getNoticeList = async (req, res) => {
  const { startDate, endDate } = req.query;

  // バリデーション: startDate または endDate がない場合
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate と endDate は必須です' });
  }

  try {
    // SQL クエリに id を追加
    const results = await sequelize.query(
      `
      SELECT
        m.id,  -- id を追加
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

    // 結果を返す
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

  // バリデーション: startDate または endDate がない場合は 400 Bad Request
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate と endDate は必須です' });
  }

  try {
    const results = await sequelize.query(
      `
      SELECT
        m.id,  -- id を追加
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

    // 結果を返す
    res.json(results);
  } catch (err) {
    console.error('その他一覧の取得に失敗:', err);
    res.status(500).json({
      error: 'その他一覧の取得に失敗しました',
      detail: err.message,
    });
  }
};

// backend/controllers/mailController.js

exports.updateMail = async (req, res) => {
  const { id } = req.params;  // 対象の郵便物ID
  const { received_at, client_id, type, payment_date, bank_account_id, amount, description, note, status } = req.body;

  try {
    // idが正しく渡されているか確認するためにログ出力
    console.log("更新対象ID:", id);  // ここでidが正しく渡っているか確認

    // 郵便物の存在を確認
    const mail = await Mail.findByPk(id);
    if (!mail) {
      return res.status(404).json({ error: "郵便物が見つかりません" });
    }

    // 更新処理
    mail.received_at = received_at || mail.received_at;
    mail.client_id = client_id || mail.client_id;
    mail.type = type || mail.type;
    mail.payment_date = payment_date || mail.payment_date;
    mail.bank_account_id = bank_account_id || mail.bank_account_id;
    mail.amount = amount || mail.amount;
    mail.description = description || mail.description;
    mail.note = note || mail.note;
    mail.status = status || mail.status;

    // 保存
    await mail.save();  // データベースの更新

    res.status(200).json({
      success: true,
      message: "郵便物が更新されました",
      mail,  // 更新された郵便物データを返す
    });
  } catch (error) {
    console.error("❌ Error updating mail:", error);
    res.status(500).json({
      error: "更新処理に失敗しました",
      details: error.message,
    });
  }
};

// backend/controllers/mailController.js
exports.deleteMail = async (req, res) => {
  const { id } = req.params;
  console.log("削除対象ID:", id);  // バックエンドでも確認

  if (!id) {
    return res.status(400).json({ error: "郵便物IDが必要です" });
  }

  try {
    const mail = await Mail.findByPk(id);
    if (!mail) {
      return res.status(404).json({ error: "郵便物が見つかりません" });
    }

    await mail.destroy();  // データベースから削除

    res.status(200).json({ success: true, message: "郵便物が削除されました" });
  } catch (error) {
    console.error("❌ Error deleting mail:", error);
    res.status(500).json({
      error: "削除処理に失敗しました",
      details: error.message
    });
  }
};

// 📁 src/controllers/mailsController.js に追加
exports.getTransferListByMonth = async (req, res) => {
  const { month } = req.params;
  try {
    const results = await sequelize.query(
      'EXEC sp_GetTransferListByMonth @TargetMonth = :month',
      {
        replacements: { month },
        type: sequelize.QueryTypes.SELECT
      }
    );
    res.json(results);
  } catch (err) {
    console.error('ストアド実行エラー:', err);
    res.status(500).json({ error: '一覧取得失敗', details: err.message });
  }
};

// 引落一覧（月指定）取得（ストアド実行）
exports.getWithdrawalListByMonth = async (req, res) => {
  const { month } = req.params; // 形式：'2025-04'

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: '不正な月の形式です（例: 2025-04）' });
  }

  try {
    const resultSets = await sequelize.query(
      `EXEC GetWithdrawalListByMonth @Month = :month`,
      {
        replacements: { month },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
        nest: true,
      }
    );

    // Sequelize で複数結果セットを扱うには特殊な扱いが必要（MSSQL特有）
    // Sequelize v6 では1つの配列に結合されることがあるため、フィルタで明細とサマリを分ける
    const data = Array.isArray(resultSets) ? resultSets : [];

    // 明細とサマリの区別（amountがあるものが明細、ないものがサマリ）
    const transfers = data.filter(row => row.amount !== undefined);
    const summary = data.find(row => row.件数 !== undefined) || { 件数: 0, 合計金額: 0 };

    res.json({ transfers, summary });
  } catch (err) {
    console.error('❌ 引落一覧取得失敗（ストアド）:', err);
    res.status(500).json({ error: '引落一覧の取得に失敗しました', details: err.message });
  }
};


// 📌 振込 + 引落 + 合計取得API（ストアド実行版）
exports.getTransferAndWithdrawalSummary = async (req, res) => {
  const { startDate, endDate } = req.query;

  // バリデーションチェック
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDateとendDateは必須です' });
  }

  try {
    const resultSets = await sequelize.query(
      `EXEC GetTransfersAndWithdrawals @StartDate = :startDate, @EndDate = :endDate`,
      {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
        nest: true,
      }
    );

    // 👉 結果セットの分類処理
    const transfers = resultSets.filter(r => r.type === '振込');
    const withdrawals = resultSets.filter(r => r.type === '引落');
    const summary = resultSets.find(r => r.label === 'summary') || {
      label: 'summary',
      transfer_count: 0,
      transfer_total: 0,
      withdrawal_count: 0,
      withdrawal_total: 0,
      total_count: 0,
      total_amount: 0,
    };

    // ✅ レスポンス返却
    res.status(200).json({
      transfers,
      withdrawals,
      summary
    });

  } catch (err) {
    console.error('❌ ストアド実行失敗:', err);
    res.status(500).json({
      error: '振込・引落・集計情報の取得に失敗しました',
      detail: err.message
    });
  }
};





