const sequelize = require('../config/database');
const Mail = require('../models/Mail');

const formatDateTime = (dateStr) => {
  if (!dateStr) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  return new Date(dateStr).toISOString().slice(0, 19).replace('T', ' ');
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toISOString().split('T')[0];
};

const toNullableNumber = (value) => {
  if (value === '' || value === null || typeof value === 'undefined') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

const baseMailSelectSql = `
  SELECT
    m.id,
    m.type,
    m.client_id,
    m.bank_account_id,
    m.category_id,
    m.received_at,
    m.payment_date,
    m.status,
    c.name AS client_name,
    cat.name AS category_name,
    m.amount,
    CASE
      WHEN m.type = '振込' AND m.client_id IS NOT NULL
        THEN CONCAT(ISNULL(c.bank_name, ''), '（', ISNULL(c.bank_account, ''), '）')
      WHEN m.type = '引落' AND wc.id IS NOT NULL
        THEN CONCAT(ISNULL(wc.bank_name, ''), '（', ISNULL(wc.bank_account, ''), '）')
      ELSE NULL
    END AS bank_account_name,
    m.description,
    m.note
  FROM mails m
  LEFT JOIN client_master c ON m.client_id = c.id
  LEFT JOIN company_master wc ON c.withdrawal_company_id = wc.id
  LEFT JOIN category_master cat ON m.category_id = cat.id
`;

exports.createMail = async (req, res) => {
  try {
    const result = await sequelize.query(
      `
      EXEC InsertMailRecord
        @received_at=:received_at,
        @client_id=:client_id,
        @type=:type,
        @payment_date=:payment_date,
        @bank_account_id=:bank_account_id,
        @amount=:amount,
        @category_id=:category_id,
        @note=:note,
        @status=:status,
        @created_at=:created_at
      `,
      {
        replacements: {
          received_at: formatDateTime(req.body.received_at),
          client_id: toNullableNumber(req.body.client_id),
          type: req.body.type || null,
          payment_date: formatDate(req.body.payment_date),
          bank_account_id: toNullableNumber(req.body.bank_account_id),
          amount: req.body.amount || null,
          category_id: toNullableNumber(req.body.category_id),
          note: req.body.note || null,
          status: req.body.status || '未処理',
          created_at: formatDateTime(new Date()),
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.status(201).json({
      success: true,
      insertedId: result[0]?.new_id || null,
    });
  } catch (error) {
    console.error('郵便物登録失敗:', error);
    res.status(500).json({
      error: '郵便物登録失敗',
      detail: error.message,
    });
  }
};

exports.getMails = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate と endDate は必須です' });
  }

  try {
    const results = await sequelize.query(
      `
      ${baseMailSelectSql}
      WHERE
        (
          m.payment_date BETWEEN :startDate AND :endDate
          OR m.received_at BETWEEN :startDate AND :endDate
        )
      ORDER BY
        m.payment_date ASC,
        m.received_at ASC,
        m.id ASC
      `,
      {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.status(200).json(results);
  } catch (err) {
    console.error('郵便物一覧取得失敗:', err);
    res.status(500).json({
      error: '郵便物一覧取得失敗',
      detail: err.message,
    });
  }
};

exports.getTransferList = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate と endDate は必須です' });
  }

  try {
    const results = await sequelize.query(
      `
      ${baseMailSelectSql}
      WHERE
        m.type = '振込'
        AND m.payment_date BETWEEN :startDate AND :endDate
      ORDER BY
        m.payment_date ASC,
        c.name ASC,
        m.received_at ASC,
        m.id ASC
      `,
      {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.status(200).json(results);
  } catch (err) {
    console.error('振込一覧取得失敗:', err);
    res.status(500).json({
      error: '振込一覧取得失敗',
      detail: err.message,
    });
  }
};

exports.getWithdrawalList = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate と endDate は必須です' });
  }

  try {
    const results = await sequelize.query(
      `
      ${baseMailSelectSql}
      WHERE
        m.type = '引落'
        AND m.payment_date BETWEEN :startDate AND :endDate
      ORDER BY
        m.payment_date ASC,
        c.name ASC,
        m.received_at ASC,
        m.id ASC
      `,
      {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.status(200).json(results);
  } catch (err) {
    console.error('引落一覧取得失敗:', err);
    res.status(500).json({
      error: '引落一覧取得失敗',
      detail: err.message,
    });
  }
};

exports.getNoticeList = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate と endDate は必須です' });
  }

  try {
    const results = await sequelize.query(
      `
      ${baseMailSelectSql}
      WHERE
        m.type = '通知'
        AND m.received_at BETWEEN :startDate AND :endDate
      ORDER BY
        m.received_at ASC,
        m.id ASC
      `,
      {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.status(200).json(results);
  } catch (err) {
    console.error('通知一覧取得失敗:', err);
    res.status(500).json({
      error: '通知一覧取得失敗',
      detail: err.message,
    });
  }
};

exports.getOtherList = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate と endDate は必須です' });
  }

  try {
    const results = await sequelize.query(
      `
      ${baseMailSelectSql}
      WHERE
        m.type = 'その他'
        AND m.received_at BETWEEN :startDate AND :endDate
      ORDER BY
        m.received_at ASC,
        m.id ASC
      `,
      {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.status(200).json(results);
  } catch (err) {
    console.error('その他一覧取得失敗:', err);
    res.status(500).json({
      error: 'その他一覧取得失敗',
      detail: err.message,
    });
  }
};

exports.updateMail = async (req, res) => {
  const { id } = req.params;

  const {
    received_at,
    client_id,
    type,
    payment_date,
    bank_account_id,
    amount,
    description,
    note,
    status,
    category_id,
  } = req.body;

  try {
    const mail = await Mail.findByPk(id);

    if (!mail) {
      return res.status(404).json({ error: '郵便物が見つかりません' });
    }

    mail.received_at = typeof received_at !== 'undefined' ? received_at : mail.received_at;
    mail.client_id =
      typeof client_id !== 'undefined' ? toNullableNumber(client_id) : mail.client_id;
    mail.type = typeof type !== 'undefined' ? type : mail.type;
    mail.payment_date = typeof payment_date !== 'undefined' ? payment_date : mail.payment_date;
    mail.bank_account_id =
      typeof bank_account_id !== 'undefined'
        ? toNullableNumber(bank_account_id)
        : mail.bank_account_id;
    mail.amount = typeof amount !== 'undefined' ? amount : mail.amount;
    mail.description = typeof description !== 'undefined' ? description : mail.description;
    mail.note = typeof note !== 'undefined' ? note : mail.note;
    mail.status = typeof status !== 'undefined' ? status : mail.status;
    mail.category_id =
      typeof category_id !== 'undefined' ? toNullableNumber(category_id) : mail.category_id;

    await mail.save();

    res.status(200).json({
      success: true,
      message: '郵便物が更新されました',
      mail,
    });
  } catch (error) {
    console.error('郵便物更新失敗:', error);
    res.status(500).json({
      error: '郵便物更新失敗',
      detail: error.message,
    });
  }
};

exports.deleteMail = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: '郵便物IDが必要です' });
  }

  try {
    const mail = await Mail.findByPk(id);

    if (!mail) {
      return res.status(404).json({ error: '郵便物が見つかりません' });
    }

    await mail.destroy();

    res.status(200).json({
      success: true,
      message: '郵便物が削除されました',
    });
  } catch (error) {
    console.error('郵便物削除失敗:', error);
    res.status(500).json({
      error: '郵便物削除失敗',
      detail: error.message,
    });
  }
};

exports.getTransferListByMonth = async (req, res) => {
  const { month } = req.params;

  try {
    const results = await sequelize.query('EXEC sp_GetTransferListByMonth @TargetMonth = :month', {
      replacements: { month },
      type: sequelize.QueryTypes.SELECT,
    });

    res.status(200).json(results);
  } catch (err) {
    console.error('月別振込一覧取得失敗:', err);
    res.status(500).json({
      error: '月別振込一覧取得失敗',
      detail: err.message,
    });
  }
};

exports.getWithdrawalListByMonth = async (req, res) => {
  const { month } = req.params;

  if (!month || !/^\\d{4}-\\d{2}$/.test(month)) {
    return res.status(400).json({ error: '不正な月の形式です（例: 2025-04）' });
  }

  try {
    const resultSets = await sequelize.query('EXEC GetWithdrawalListByMonth @Month = :month', {
      replacements: { month },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
      nest: true,
    });

    const data = Array.isArray(resultSets) ? resultSets : [];
    const transfers = data.filter((row) => row.amount !== undefined);
    const summary = data.find((row) => row.件数 !== undefined) || {
      件数: 0,
      合計金額: 0,
    };

    res.status(200).json({
      transfers,
      summary,
    });
  } catch (err) {
    console.error('月別引落一覧取得失敗:', err);
    res.status(500).json({
      error: '月別引落一覧取得失敗',
      detail: err.message,
    });
  }
};

exports.getTransferAndWithdrawalSummary = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate と endDate は必須です' });
  }

  try {
    const resultSets = await sequelize.query(
      'EXEC GetTransfersAndWithdrawals @StartDate = :startDate, @EndDate = :endDate',
      {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
        nest: true,
      }
    );

    const transfers = resultSets.filter((row) => row.type === '振込');
    const withdrawals = resultSets.filter((row) => row.type === '引落');
    const summary = resultSets.find((row) => row.label === 'summary') || {
      transfer_count: 0,
      transfer_total: 0,
      withdrawal_count: 0,
      withdrawal_total: 0,
      total_count: 0,
      total_amount: 0,
    };
    const balances = resultSets.filter((row) => row.account_label);
    const totalCash = resultSets.find((row) => row.label === 'total_cash') || {
      total_cash_balance: 0,
    };

    res.status(200).json({
      transfers,
      withdrawals,
      summary,
      balances,
      totalCash,
    });
  } catch (err) {
    console.error('振込・引落集計取得失敗:', err);
    res.status(500).json({
      error: '振込・引落集計取得失敗',
      detail: err.message,
    });
  }
};

exports.markAsPaid = async (req, res) => {
  const { id } = req.params;

  try {
    const mail = await Mail.findByPk(id);

    if (!mail) {
      return res.status(404).json({ error: 'データが見つかりません' });
    }

    if (mail.type !== '振込') {
      return res.status(400).json({ error: '振込以外は対象外です' });
    }

    mail.status = '振込済み';
    await mail.save();

    res.status(200).json({
      message: '振込済みに更新しました',
      data: mail,
    });
  } catch (err) {
    console.error('振込済み更新失敗:', err);
    res.status(500).json({ error: 'サーバーエラー' });
  }
};

exports.markAsUnpaid = async (req, res) => {
  const { id } = req.params;

  try {
    const mail = await Mail.findByPk(id);

    if (!mail) {
      return res.status(404).json({ error: 'データが見つかりません' });
    }

    if (mail.type !== '振込') {
      return res.status(400).json({ error: '振込以外は対象外です' });
    }

    mail.status = '未処理';
    await mail.save();

    res.status(200).json({
      message: '未処理に戻しました',
      data: mail,
    });
  } catch (err) {
    console.error('未処理更新失敗:', err);
    res.status(500).json({ error: 'サーバーエラー' });
  }
};
