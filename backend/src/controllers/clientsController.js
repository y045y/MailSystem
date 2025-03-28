// 📁 src/controllers/clientController.js
const Client = require('../models/Client');

// ✅ 取引先一覧を取得 (GET /clients)
exports.getClients = async (req, res) => {
  try {
    const clients = await Client.findAll();
    res.status(200).json(clients);
  } catch (error) {
    console.error('❌ Error fetching clients:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// ✅ 取引先を登録 (POST /clients)
exports.createClient = async (req, res) => {
  try {
    const { name, bank_name, bank_account } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const newClient = await Client.create({
      name,
      bank_name,
      bank_account,
    });

    res.status(201).json(newClient);
  } catch (error) {
    console.error('❌ Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client', details: error.message });
  }
};
