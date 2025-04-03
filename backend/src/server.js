const express = require("express");
const cors = require("cors");
require("dotenv").config();
const sequelize = require("./config/database");
const companyRoutes = require('./routes/companyRoutes'); 
const mailRoutes = require("./routes/mailRoutes"); // 追加
const clientRoutes = require('./routes/clientsRoutes'); 
const bankAccountsRoutes = require('./routes/bankAccountsRoutes');
const transferListRoutes = require('./routes/transferListRoutes'); // ← これを追加！

const app = express();
app.use(cors());
app.use(express.json());


// APIルートを設定
app.use("/mails", mailRoutes); // 追加
app.use('/clients', clientRoutes);
app.use('/companies', companyRoutes); 
app.use("/bank-accounts", bankAccountsRoutes);



// DB同期
sequelize.sync()
  .then(() => console.log("Database synced"))
  .catch(err => console.error("DB sync error:", err));

app.get("/", (req, res) => {
  res.send("MailSystem Backend Running!");
});


app.listen(5000, async () => {
  try {
    await sequelize.authenticate();
    console.log("DB Connected & Server running on port 5000");
  } catch (error) {
    console.error("DB Connection failed:", error);
  }
});
