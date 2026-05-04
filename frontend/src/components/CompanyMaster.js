import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import '../styles/FormCommon.css';
import '../styles/TableCommon.css';

const CompanyMaster = () => {
  const [companies, setCompanies] = useState([]);

  const initialForm = {
    bank_name: '',
    bank_account: '',
    account_type: '流動',
  };

  const [form, setForm] = useState(initialForm);

  const bankRef = useRef();
  const accountRef = useRef();
  const typeRef = useRef();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const res = await axios.get('http://localhost:5000/company-master');
    setCompanies(res.data);
  };

  const handleEnter = (e, nextRef) => {
    if (e.key !== 'Enter') return;

    e.preventDefault();

    if (e.ctrlKey) {
      handleSubmit();
      return;
    }

    nextRef?.current?.focus();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!form.bank_name.trim()) {
      alert('銀行名は必須です');
      bankRef.current.focus();
      return;
    }

    if (!form.bank_account.trim()) {
      alert('口座番号は必須です');
      accountRef.current.focus();
      return;
    }

    await axios.post('http://localhost:5000/company-master', form);

    setForm(initialForm);
    fetchCompanies();
    bankRef.current.focus();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('削除する？')) return;

    await axios.delete(`http://localhost:5000/company-master/${id}`);
    fetchCompanies();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="form-card company-form">
        <div className="form-line">
          <div className="form-item">
            <label className="form-label">銀行</label>
            <input
              ref={bankRef}
              type="text"
              name="bank_name"
              value={form.bank_name}
              onChange={handleChange}
              onKeyDown={(e) => handleEnter(e, accountRef)}
              className="form-control form-sm w-client"
              placeholder="例：三井住友"
            />
          </div>

          <div className="form-item">
            <label className="form-label">口座</label>
            <input
              ref={accountRef}
              type="text"
              name="bank_account"
              value={form.bank_account}
              onChange={handleChange}
              onKeyDown={(e) => handleEnter(e, typeRef)}
              className="form-control form-sm w-type"
              placeholder="例：1234567"
            />
          </div>

          <div className="form-item">
            <label className="form-label">区分</label>
            <select
              ref={typeRef}
              name="account_type"
              value={form.account_type}
              onChange={handleChange}
              onKeyDown={(e) => handleEnter(e)}
              className="form-select form-sm w-type"
            >
              <option value="流動">流動</option>
              <option value="定期">定期</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-submit">
            登録
          </button>
        </div>

        <div className="form-help">Enter：次 / Ctrl+Enter：登録</div>
      </form>

      <table className="table table-bordered table-sm align-middle table-common">
        <thead className="table-dark">
          <tr>
            <th>銀行</th>
            <th>口座</th>
            <th>区分</th>
            <th>削除</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id}>
              <td>{company.bank_name}</td>
              <td>{company.bank_account}</td>
              <td>{company.account_type}</td>
              <td>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(company.id)}
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
