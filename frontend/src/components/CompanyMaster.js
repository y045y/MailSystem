// 📁 src/components/CompanyMaster.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CompanyMaster = () => {
  const [companies, setCompanies] = useState([]); // 自社口座一覧
  const [form, setForm] = useState({
    bank_name: '',
    bank_account: '',
  });
  const [editCompany, setEditCompany] = useState(null); // 編集対象

  useEffect(() => {
    fetchCompanies();
  }, []);

  // 自社口座一覧取得 (GET /company-master)
  const fetchCompanies = async () => {
    try {
      const res = await axios.get('http://localhost:5000/company-master');
      setCompanies(res.data);
    } catch (err) {
      console.error('会社口座一覧取得失敗:', err);
    }
  };

  const handleChange = (e) => {
    if (editCompany) {
      setEditCompany({ ...editCompany, [e.target.name]: e.target.value });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = editCompany || form;
    const { bank_name, bank_account } = data;

    if (!bank_name.trim() || !bank_account.trim()) {
      alert('銀行名と口座番号は必須です');
      return;
    }

    try {
      if (editCompany) {
        await axios.put(`http://localhost:5000/company-master/${editCompany.id}`, data);
        setEditCompany(null);
      } else {
        await axios.post('http://localhost:5000/company-master', form);
        setForm({ bank_name: '', bank_account: '' });
      }
      fetchCompanies();
    } catch (err) {
      console.error('会社口座登録/更新失敗:', err);
    }
  };

  const handleEdit = (company) => {
    setEditCompany(company);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('本当に削除しますか？')) return;
    try {
      await axios.delete(`http://localhost:5000/company-master/${id}`);
      fetchCompanies();
    } catch (err) {
      console.error('削除に失敗:', err);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>自社マスタ（口座一覧）</h2>

      {/* 登録/編集フォーム */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <input
          name="bank_name"
          value={editCompany ? editCompany.bank_name : form.bank_name}
          onChange={handleChange}
          placeholder="銀行名（例：三井住友）"
          required
          style={{ width: '150px', marginRight: '10px' }}
        />
        <input
          name="bank_account"
          value={editCompany ? editCompany.bank_account : form.bank_account}
          onChange={handleChange}
          placeholder="口座番号（例：1234567）"
          required
          style={{ width: '150px', marginRight: '10px' }}
        />
        <button type="submit">{editCompany ? '保存' : '口座追加'}</button>
        {editCompany && (
          <button type="button" onClick={() => setEditCompany(null)} style={{ marginLeft: '10px' }}>
            キャンセル
          </button>
        )}
      </form>

      {/* 一覧表示 */}
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>銀行名</th>
            <th>口座番号</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c.id}>
              <td>{c.bank_name}</td>
              <td>{c.bank_account}</td>
              <td>
                <button onClick={() => handleEdit(c)}>修正</button>
                <button onClick={() => handleDelete(c.id)} style={{ marginLeft: '5px' }}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyMaster;
