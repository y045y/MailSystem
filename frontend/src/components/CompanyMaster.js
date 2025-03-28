import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CompanyMaster = () => {
  const [accounts, setAccounts] = useState([]); // 自社口座一覧
  const [form, setForm] = useState({
    name: '', // 登録用の口座名
  });

  // 初回マウント時に一覧取得
  useEffect(() => {
    fetchAccounts();
  }, []);

  // 自社口座一覧を取得（GET /bank-accounts/company）
  const fetchAccounts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/bank-accounts/company');
      setAccounts(res.data);
    } catch (err) {
      console.error('会社口座一覧取得失敗:', err);
    }
  };

  // 入力フォームの値変更
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 登録処理（POST /bank-accounts）
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert('口座名を入力してください');
      return;
    }

    try {
      await axios.post('http://localhost:5000/bank-accounts', {
        name: form.name,
        type: 'company', // 自社用として登録
      });
      setForm({ name: '' }); // フォーム初期化
      fetchAccounts(); // 一覧を再取得
    } catch (err) {
      console.error('会社口座登録失敗:', err);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>自社マスタ（口座一覧）</h2>

      {/* 登録フォーム */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="銀行口座名（例：三井住友 渋谷支店 普通1234567）"
          required
          style={{ width: '300px', marginRight: '10px' }}
        />
        <button type="submit">口座追加</button>
      </form>

      {/* 一覧表示 */}
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>口座名</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyMaster;
