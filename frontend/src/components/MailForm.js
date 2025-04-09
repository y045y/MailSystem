import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/MailForm.css';

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

  useEffect(() => {
    axios.get('http://localhost:5000/clients')
      .then(response => setClients(response.data))
      .catch(error => console.error('クライアントデータの取得に失敗:', error));
  }, []);

  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        if (formData.type === '振込' && formData.sender) {
          const res = await axios.get(`http://localhost:5000/clients/${formData.sender}`);
          const client = res.data;
          if (client.bank_name && client.bank_account) {
            setBankAccounts([{
              id: client.id,
              name: `${client.bank_name}（${client.bank_account}）`
            }]);
          } else {
            setBankAccounts([]);
          }
        } else if ((formData.type === '引落' || formData.type === 'カードの請求書') && formData.sender) {
          const res = await axios.get(`http://localhost:5000/clients/${formData.sender}`);
          const client = res.data;
  
          if (client.withdrawal_company) {
            setBankAccounts([{
              id: client.withdrawal_company.id,
              name: `${client.withdrawal_company.bank_name}（${client.withdrawal_company.bank_account}）`
            }]);
          } else {
            setBankAccounts([]);
          }
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
        if (onReload) onReload();
      })
      .catch(error => {
        console.error('送信エラー:', error);
      });
  };

  return (
<form onSubmit={handleSubmit} className="p-3">
<div className="row g-3 align-items-end">
  <div className="col-6 col-md-2">
    <label className="form-label">確認日:</label>
    <input
      type="date"
      name="received_at"
      value={formData.received_at}
      onChange={handleChange}
      className="form-control"
      style={{ height: '38px', paddingTop: '6px', paddingBottom: '6px' }}
      required
    />
  </div>


    <div className="col-6 col-md-2">
      <label className="form-label">取引先:</label>
      <select
        name="sender"
        value={formData.sender}
        onChange={handleChange}
        className="form-select"
        required
      >
        <option value="">選択可</option>
        {clients.map(client => (
          <option key={client.id} value={client.id}>{client.name}</option>
        ))}
      </select>
    </div>

    <div className="col-6 col-md-2">
      <label className="form-label">郵便種別:</label>
      <select
        name="type"
        value={formData.type}
        onChange={handleChange}
        className="form-select"
        required
      >
        <option value="">選択可</option>
        <option value="引落">引落</option>
        <option value="振込">振込</option>
        <option value="通知">通知</option>
        <option value="その他">その他</option>
      </select>
    </div>
    { (formData.type === '振込' || formData.type === '引落' || formData.type === 'カードの請求書') && (
      <div className="col-12 col-md-2">
        <label className="form-label">振込・引落口座:</label>
        <select
          name="bank_account_id"
          value={formData.bank_account_id}
          onChange={handleChange}
          className="form-select"
          required
        >
          <option value="">選択可</option>
          {bankAccounts.map(account => (
            <option key={account.id} value={account.id}>{account.name}</option>
          ))}
        </select>
      </div>
    )}

    <div className="col-6 col-md-2">
      <label className="form-label">期限日:</label>
      <input
        type="date"
        name="payment_date"
        value={formData.payment_date}
        onChange={handleChange}
        className="form-control"
      />
    </div>
    <div className="col-6 col-md-2">
  <label className="form-label">金額:</label>
  <input
    type="number"
    name="amount"
    value={formData.amount}
    onChange={handleChange}
    className="form-control"
    required={formData.type === '振込' || formData.type === '引落' || formData.type === 'カードの請求書'}
  />
</div>


    <div className="col-6 col-md-2">
      <label className="form-label">説明:</label>
      <input
        type="text"
        name="description"
        value={formData.description}
        onChange={handleChange}
        className="form-control"
      />
    </div>



  {/* メモ欄と送信ボタンの並び */}
  <div className="col-12 col-md-4">
    <label className="form-label">メモ:</label>
    <input
      type="text"
      name="note"
      value={formData.note}
      onChange={handleChange}
      className="form-control"
    />
  </div>

  <div className="col-12 col-md-8 d-flex justify-content-end align-items-end">
  <button
    type="submit"
    className="btn btn-secondary"
    style={{ width: '160px' }}
  >
    送信
  </button>
</div>

</div>
</form>

  );
};

export default MailForm;
