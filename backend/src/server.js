const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/database');

// 📦 ルートインポート
const mailRoutes = require('./routes/mailRoutes');
const clientRoutes = require('./routes/clientsRoutes');
const companyRoutes = require('./routes/companyRoutes');
const cashRoutes = require('./routes/cashRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ APIルーティング定義
app.use('/mails', mailRoutes); // 郵便物関連
app.use('/clients', clientRoutes); // 取引先マスタ
app.use('/company-master', companyRoutes); // 自社マスタ
app.use('/cash-records', cashRoutes); // ✅ キャッシュ管理ルート
app.use('/categories', categoryRoutes);

// ✅ DB同期
sequelize
  .sync()
  .then(() => console.log('✅ Database synced'))
  .catch((err) => console.error('❌ DB sync error:', err));

// ✅ ルート確認用エンドポイント
app.get('/', (req, res) => {
  res.send('MailSystem Backend Running!');
});

// ✅ サーバー起動
app.listen(5000, async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB Connected & Server running on port 5000');
  } catch (error) {
    console.error('❌ DB Connection failed:', error);
  }
});
