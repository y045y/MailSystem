const sequelize = require('../config/database');

const getTransferListByMonth = async (req, res) => {
  const { month } = req.params;

  try {
    const result = await sequelize.query(
      'EXEC GetTransferListByMonth :month',
      {
        replacements: { month },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    res.status(200).json(result);
  } catch (err) {
    console.error('ストアド実行エラー:', err);
    res.status(500).json({ error: '振込一覧の取得に失敗しました。' });
  }
};

module.exports = {
  getTransferListByMonth,
};
