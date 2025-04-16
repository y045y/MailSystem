import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const CompanyMaster = () => {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ bank_name: '', bank_account: '', account_type: '流動' });
  const [editCompany, setEditCompany] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get('http://localhost:5000/company-master');
      setCompanies(res.data);
    } catch (err) {
      console.error('会社口座一覧取得失敗:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (editCompany) {
      setEditCompany({ ...editCompany, [name]: value });
    } else {
      setForm({ ...form, [name]: value });
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
        setForm({ bank_name: '', bank_account: '', account_type: '流動' });
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
    <div className="container py-4">
      <h2 className="mb-4">自社マスタ（口座一覧）</h2>

      {/* 登録・編集フォーム */}
      <form onSubmit={handleSubmit} className="row g-3 mb-4 align-items-end">
        <div className="col-auto">
          <label className="form-label">銀行名</label>
          <input
            type="text"
            name="bank_name"
            value={(editCompany ? editCompany.bank_name : form.bank_name) ?? ''}
            onChange={handleChange}
            className="form-control"
            placeholder="例：三井住友"
            required
          />
        </div>
        <div className="col-auto">
          <label className="form-label">口座番号</label>
          <input
            type="text"
            name="bank_account"
            value={(editCompany ? editCompany.bank_account : form.bank_account) ?? ''}
            onChange={handleChange}
            className="form-control"
            placeholder="例：1234567"
            required
          />
        </div>
        <div className="col-auto">
          <label className="form-label">口座区分</label>
          <select
            name="account_type"
            value={(editCompany ? editCompany.account_type : form.account_type) ?? '流動'}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="流動">流動</option>
            <option value="定期">定期</option>
          </select>
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-secondary">
            {editCompany ? '保存' : '口座追加'}
          </button>
          {editCompany && (
            <button
              type="button"
              onClick={() => setEditCompany(null)}
              className="btn btn-outline-secondary ms-2"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      {/* 一覧表示テーブル */}
      <table className="table table-bordered">
        <thead className="table-dark">
          <tr>
            <th>銀行名</th>
            <th>口座番号</th>
            <th>口座区分</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c.id}>
              <td>{c.bank_name}</td>
              <td>{c.bank_account}</td>
              <td>{c.account_type}</td>
              <td>
                <button
                  className="btn btn-sm btn-secondary me-2"
                  onClick={() => handleEdit(c)}
                >
                  修正
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(c.id)}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyMaster;
