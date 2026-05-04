import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import '../styles/FormCommon.css';
import '../styles/TableCommon.css';
import '../styles/ClientMaster.css';

const ClientMaster = () => {
  const [clients, setClients] = useState([]);
  const [companies, setCompanies] = useState([]);

  const initialForm = {
    name: '',
    bank_name: '',
    bank_account: '',
    withdrawal_company_id: '',
  };

  const [form, setForm] = useState(initialForm);

  // ===== ref（Enter移動用） =====
  const nameRef = useRef();
  const bankRef = useRef();
  const accountRef = useRef();
  const companyRef = useRef();

  // ===== 初期取得 =====
  useEffect(() => {
    fetchClients();
    fetchCompanies();
  }, []);

  const fetchClients = async () => {
    const res = await axios.get('http://localhost:5000/clients');
    setClients(res.data);
  };

  const fetchCompanies = async () => {
    const res = await axios.get('http://localhost:5000/company-master');
    setCompanies(res.data);
  };

  // ===== Enter移動 =====
  const handleEnter = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (e.ctrlKey) {
        handleSubmit();
        return;
      }

      nextRef?.current?.focus();
    }
  };

  // ===== 入力変更 =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ===== 登録 =====
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!form.name.trim()) {
      alert('取引先名必須');
      nameRef.current.focus();
      return;
    }

    const payload = {
      ...form,
      withdrawal_company_id: form.withdrawal_company_id ? Number(form.withdrawal_company_id) : null,
    };

    await axios.post('http://localhost:5000/clients', payload);

    setForm(initialForm);
    fetchClients();
    nameRef.current.focus();
  };

  // ===== 削除 =====
  const handleDelete = async (id) => {
    if (!window.confirm('削除する？')) return;
    await axios.delete(`http://localhost:5000/clients/${id}`);
    fetchClients();
  };

  return (
    <div>
      {/* ===== 入力フォーム ===== */}
      <form onSubmit={handleSubmit} className="form-card client-form">
        <div className="form-line">
          <div className="form-item">
            <label className="form-label">取引先</label>
            <input
              ref={nameRef}
              name="name"
              value={form.name}
              onChange={handleChange}
              onKeyDown={(e) => handleEnter(e, bankRef)}
              className="form-control form-sm w-client"
            />
          </div>

          <div className="form-item">
            <label className="form-label">銀行</label>
            <input
              ref={bankRef}
              name="bank_name"
              value={form.bank_name}
              onChange={handleChange}
              onKeyDown={(e) => handleEnter(e, accountRef)}
              className="form-control form-sm w-type"
            />
          </div>

          <div className="form-item">
            <label className="form-label">口座</label>
            <input
              ref={accountRef}
              name="bank_account"
              value={form.bank_account}
              onChange={handleChange}
              onKeyDown={(e) => handleEnter(e, companyRef)}
              className="form-control form-sm w-type"
            />
          </div>

          <div className="form-item">
            <label className="form-label">引落口座</label>
            <select
              ref={companyRef}
              name="withdrawal_company_id"
              value={form.withdrawal_company_id}
              onChange={handleChange}
              onKeyDown={(e) => handleEnter(e)}
              className="form-select form-sm w-bank"
            >
              <option value="">選択</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.bank_name}（{c.bank_account}）
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-submit">
            登録
          </button>
        </div>

        <div className="form-help">Enter：次 / Ctrl+Enter：登録</div>
      </form>

      {/* ===== 一覧 ===== */}
      <table className="table table-bordered table-sm align-middle table-common">
        <thead className="table-dark">
          <tr>
            <th>取引先</th>
            <th>銀行</th>
            <th>口座</th>
            <th>引落口座</th>
            <th>削除</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.bank_name || '―'}</td>
              <td>{c.bank_account || '―'}</td>
              <td>
                {c.withdrawal_company
                  ? `${c.withdrawal_company.bank_name}（${c.withdrawal_company.bank_account}）`
                  : '―'}
              </td>
              <td>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>
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

export default ClientMaster;
