const CashRecord = require('../models/CashRecord');

exports.getAllCashRecords = async (req, res) => {
  try {
    const records = await CashRecord.findAll({ include: ['company'] });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: '取得失敗', details: err.message });
  }
};

exports.createCashRecord = async (req, res) => {
    try {
      console.log('📥 受け取ったデータ:', req.body);
  
      const { company_id, date, balance, note } = req.body;
  
      // 📌 形式が YYYY-MM-DD か軽くチェック
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: '日付の形式が不正です（YYYY-MM-DD）' });
      }
  
      const newRecord = await CashRecord.create({
        company_id,
        date, // ← Dateにせず、そのまま！
        balance,
        note,
      });
  
      res.status(201).json(newRecord);
    } catch (err) {
      console.error('❌ エラー詳細:', err);
      res.status(500).json({ error: '登録失敗', details: err.message });
    }
  };
  
  
  