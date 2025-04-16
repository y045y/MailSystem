const CashRecord = require('../models/CashRecord');

// 一覧取得（会社情報とJOIN）
exports.getAllCashRecords = async (req, res) => {
  try {
    const records = await CashRecord.findAll({ include: ['company'] });
    res.json(records);
  } catch (err) {
    console.error('❌ 取得失敗:', err);
    res.status(500).json({ error: '取得失敗', details: err.message });
  }
};

// 登録
exports.createCashRecord = async (req, res) => {
  try {
    console.log('📥 受け取ったデータ:', req.body);

    const { company_id, date, balance, note } = req.body;

    // 日付形式チェック
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: '日付の形式が不正です（YYYY-MM-DD）' });
    }

    const newRecord = await CashRecord.create({
      company_id,
      date,
      balance,
      note,
    });

    res.status(201).json(newRecord);
  } catch (err) {
    console.error('❌ 登録エラー:', err);
    res.status(500).json({ error: '登録失敗', details: err.message });
  }
};

// 更新
exports.updateCashRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id, date, balance, note } = req.body;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: '日付の形式が不正です（YYYY-MM-DD）' });
    }

    const record = await CashRecord.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: '該当データが見つかりません' });
    }

    record.company_id = company_id;
    record.date = date;
    record.balance = balance;
    record.note = note;

    await record.save();
    res.json(record);
  } catch (err) {
    console.error('❌ 更新エラー:', err);
    res.status(500).json({ error: '更新失敗', details: err.message });
  }
};

// 削除
exports.deleteCashRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CashRecord.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ error: '該当データが存在しません' });
    }

    res.json({ message: '削除完了' });
  } catch (err) {
    console.error('❌ 削除エラー:', err);
    res.status(500).json({ error: '削除失敗', details: err.message });
  }
};
