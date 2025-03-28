import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ClientMaster = () => {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    name: '',
    bank_name: '',
    bank_account: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await axios.get('http://localhost:5000/clients');
      setClients(res.data);
    } catch (err) {
      console.error('一覧取得エラー:', err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      alert('名前は必須です');
      return;
    }
    try {
      await axios.post('http://localhost:5000/clients', form);
      fetchClients(); // 一覧再取得
      setForm({ name: '', bank_name: '', bank_account: '' }); // 初期化
    } catch (err) {
      console.error('登録失敗:', err);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>取引先マスタ</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="名前"
          required
        />
        <input
          name="bank_name"
          value={form.bank_name}
          onChange={handleChange}
          placeholder="銀行名"
        />
        <input
          name="bank_account"
          value={form.bank_account}
          onChange={handleChange}
          placeholder="口座番号"
        />
        <button type="submit">登録</button>
      </form>

      <table border="1">
        <thead>
          <tr>
            <th>名前</th>
            <th>銀行名</th>
            <th>口座番号</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.bank_name}</td>
              <td>{c.bank_account}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientMaster;
