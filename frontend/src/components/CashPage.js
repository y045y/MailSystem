import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CashPage = () => {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({
    company_id: '',
    date: '',
    balance: '',
    note: '',
  });
  const [cashRecords, setCashRecords] = useState([]);

  useEffect(() => {
    axios
      .get('http://localhost:5000/company-master')
      .then((res) => setCompanies(res.data))
      .catch((err) => console.error('自社口座の取得失敗:', err));

    fetchCashRecords();
  }, []);

  const fetchCashRecords = () => {
    axios
      .get('http://localhost:5000/cash-records')
      .then((res) => setCashRecords(res.data))
      .catch((err) => console.error('キャッシュ履歴取得失敗:', err));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/cash-records', {
        ...form,
        balance: Number(form.balance),
      });
      fetchCashRecords();
      setForm({ company_id: '', date: '', balance: '', note: '' });
    } catch (err) {
      console.error('登録失敗:', err);
    }
  };

  return (
    <div className="container">
      <h2 className="my-3">キャッシュ管理</h2>

      <form onSubmit={handleSubmit} className="row g-2 mb-4 align-items-end">
        <div className="col-auto">
          <label className="form-label">自社口座</label>
          <select
            name="company_id"
            value={form.company_id}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">選択してください</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.bank_name}（{c.bank_account}）
              </option>
            ))}
          </select>
        </div>
        <div className="col-auto">
          <label className="form-label">日付</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        <div className="col-auto">
          <label className="form-label">残高</label>
          <input
            type="number"
            name="balance"
            value={form.balance}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        <div className="col-auto">
          <label className="form-label">メモ</label>
          <input name="note" value={form.note} onChange={handleChange} className="form-control" />
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-primary">
            保存
          </button>
        </div>
      </form>

      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th>日付</th>
            <th>自社口座</th>
            <th>残高</th>
            <th>メモ</th>
          </tr>
        </thead>
        <tbody>
          {cashRecords.map((r, idx) => (
            <tr key={idx}>
              <td>{r.date}</td>
              <td>{r.company_name || `${r.bank_name}（${r.bank_account}）`}</td>
              <td>{r.balance?.toLocaleString()} 円</td>
              <td>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CashPage;
