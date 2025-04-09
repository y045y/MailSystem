const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/database');

// 📦 ルートインポート
const mailRoutes = require('./routes/mailRoutes');
const clientRoutes = require('./routes/clientsRoutes');
const companyRoutes = require('./routes/companyRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ APIルーティング定義
app.use('/mails', mailRoutes); // 郵便物関連
app.use('/clients', clientRoutes); // 取引先マスタ
app.use('/company-master', companyRoutes); // 自社マスタ（ここ修正）
// 必要なら振込一覧ルートも追加
// app.use("/transfer-list", transferListRoutes);

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
