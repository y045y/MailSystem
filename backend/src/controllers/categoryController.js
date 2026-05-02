const Category = require('../models/Category');

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: {
        is_active: true,
      },
      order: [
        ['sort_order', 'ASC'],
        ['id', 'ASC'],
      ],
    });

    res.json(categories);
  } catch (error) {
    console.error('費目取得失敗:', error);
    res.status(500).json({
      error: '費目取得失敗',
      details: error.message,
    });
  }
};
