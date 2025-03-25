import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MailForm = ({ onReload }) => {
  const [formData, setFormData] = useState({
    received_at: '',
    sender: '',
    type: '',
    payment_date: '',
    amount: '',
    description: '',
    note: '',
    status: '未処理',
    bank_account_id: ''
  });

  const [clients, setClients] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  // 取引先取得
  useEffect(() => {
    axios.get('http://localhost:5000/clients')
      .then(response => setClients(response.data))
      .catch(error => console.error('クライアントデータの取得に失敗:', error));
  }, []);

  // 郵便物の種類 or 取引先変更時に口座取得
  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        if (formData.type === '振込' && formData.sender) {
          const res = await axios.get(`http://localhost:5000/bank-accounts/client/${formData.sender}`);
          setBankAccounts(res.data);
        } else if (formData.type === '引落' || formData.type === 'カードの請求書') {
          const res = await axios.get(`http://localhost:5000/bank-accounts/company`);
          setBankAccounts(res.data);
        } else {
          setBankAccounts([]);
        }
      } catch (err) {
        console.error('口座情報の取得に失敗:', err);
        setBankAccounts([]);
      }
    };
    fetchBankAccounts();
  }, [formData.type, formData.sender]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const dataToSend = {
      client_id: parseInt(formData.sender),
      received_at: formData.received_at || null,
      payment_date: formData.payment_date || null,
      amount: parseFloat(formData.amount),
      description: formData.description || '',
      note: formData.note || '',
      status: formData.status,
      type: formData.type,
      bank_account_id: formData.bank_account_id ? parseInt(formData.bank_account_id) : null
    };

    axios.post('http://localhost:5000/mails', dataToSend)
      .then(response => {
        console.log('データが送信されました:', response.data);

        // 入力初期化
        setFormData({
          received_at: '',
          sender: '',
          type: '',
          payment_date: '',
          amount: '',
          description: '',
          note: '',
          status: '未処理',
          bank_account_id: ''
        });
        setBankAccounts([]);

        // 一覧更新通知
        if (onReload) onReload();
      })
      .catch(error => {
        console.error('送信エラー:', error);
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        届いた日:
        <input
          type="date"
          name="received_at"
          value={formData.received_at}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        取引先:
        <select
          name="sender"
          value={formData.sender}
          onChange={handleChange}
          required
        >
          <option value="">選択してください</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </label>
      <label>
        郵便物の種類:
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
        >
          <option value="">選択してください</option>
          <option value="引落">引落</option>
          <option value="振込">振込</option>
          <option value="通知">通知</option>
          <option value="その他">その他</option>
        </select>
      </label>

      {(formData.type === '振込' || formData.type === '引落' || formData.type === 'カードの請求書') && (
        <label>
          振込・引落口座:
          <select
            name="bank_account_id"
            value={formData.bank_account_id}
            onChange={handleChange}
            required
          >
            <option value="">選択してください</option>
            {bankAccounts.map(account => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
        </label>
      )}

      <label>
        支払期限・引き落とし日:
        <input
          type="date"
          name="payment_date"
          value={formData.payment_date}
          onChange={handleChange}
        />
      </label>
      <label>
        金額:
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        説明:
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
      </label>
      <label>
        メモ:
        <input
          type="text"
          name="note"
          value={formData.note}
          onChange={handleChange}
        />
      </label>

      <button type="submit">送信</button>
    </form>
  );
};

export default MailForm;
