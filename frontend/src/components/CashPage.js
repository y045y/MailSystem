import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import '../styles/FormCommon.css';
import '../styles/TableCommon.css';
import '../styles/CashPage.css';

const CashPage = () => {
  const getTodayJST = () => {
    const d = new Date();
    d.setHours(d.getHours() + 9);
    return d.toISOString().slice(0, 10);
  };

  const initialForm = {
    company_id: '',
    date: getTodayJST(),
    balance: '',
    note: '',
  };

  const [companies, setCompanies] = useState([]);
  const [cashRecords, setCashRecords] = useState([]);
  const [form, setForm] = useState(initialForm);

  const companyRef = useRef(null);
  const dateRef = useRef(null);
  const balanceRef = useRef(null);
  const noteRef = useRef(null);

  useEffect(() => {
    fetchCompanies();
    fetchCashRecords();
  }, []);

  const fetchCompanies = async () => {
    const res = await axios.get('http://localhost:5000/company-master');
    setCompanies(Array.isArray(res.data) ? res.data : []);
  };

  const fetchCashRecords = async () => {
    const res = await axios.get('http://localhost:5000/cash-records');
    setCashRecords(Array.isArray(res.data) ? res.data : []);
  };

  const moveFocus = (nextRef) => {
    nextRef?.current?.focus();
    nextRef?.current?.select?.();
  };

  const handleEnter = (e, nextRef) => {
    if (e.key !== 'Enter') return;

    e.preventDefault();

    if (e.ctrlKey) {
      handleSubmit();
      return;
    }

    moveFocus(nextRef);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!form.company_id) {
      alert('自社口座を選択してください');
      moveFocus(companyRef);
      return;
    }

    if (!form.date) {
      alert('日付を入力してください');
      moveFocus(dateRef);
      return;
    }

    if (form.balance === '') {
      alert('残高を入力してください');
      moveFocus(balanceRef);
      return;
    }

    const payload = {
      company_id: Number(form.company_id),
      date: form.date,
      balance: Number(form.balance || 0),
      note: form.note || '',
    };

    await axios.post('http://localhost:5000/cash-records', payload);

    setForm((prev) => ({
      ...initialForm,
      company_id: prev.company_id,
      date: prev.date || getTodayJST(),
    }));

    await fetchCashRecords();
    moveFocus(balanceRef);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('削除する？')) return;

    await axios.delete(`http://localhost:5000/cash-records/${id}`);
    fetchCashRecords();
  };

  const groupLatestByAccountType = (accountType) => {
    const latestByCompany = {};

    cashRecords
      .filter((record) => {
        const company = companies.find((item) => Number(item.id) === Number(record.company_id));
        return company?.account_type === accountType;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach((record) => {
        if (!latestByCompany[record.company_id]) {
          latestByCompany[record.company_id] = record;
        }
      });

    return Object.values(latestByCompany)
      .map((record) => {
        const company = companies.find((item) => Number(item.id) === Number(record.company_id));
        return company ? { company, latest: record } : null;
      })
      .filter(Boolean);
  };

  const renderCashTable = (title, data) => {
    const total = data.reduce((sum, row) => sum + Number(row.latest?.balance || 0), 0);

    return (
      <>
        <h2>{title}</h2>

        <table className="table table-bordered table-sm align-middle table-common">
          <thead className="table-dark">
            <tr>
              <th>自社口座</th>
              <th>最新日付</th>
              <th>残高</th>
              <th>メモ</th>
              <th>削除</th>
            </tr>
          </thead>
          <tbody>
            {data.map(({ company, latest }) => (
              <tr key={latest.id}>
                <td>
                  {company.bank_name}（{company.bank_account}）
                </td>
                <td>{latest.date || '-'}</td>
                <td>{Number(latest.balance || 0).toLocaleString()} 円</td>
                <td>{latest.note || ''}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(latest.id)}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}

            <tr>
              <td colSpan="2">合計</td>
              <td>{total.toLocaleString()} 円</td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </>
    );
  };

  const ryudoData = groupLatestByAccountType('流動');
  const teikiData = groupLatestByAccountType('定期');

  return (
    <div>
      <form onSubmit={handleSubmit} className="form-card cash-form">
        <div className="form-line">
          <div className="form-item">
            <label className="form-label">自社口座</label>
            <select
              ref={companyRef}
              name="company_id"
              value={form.company_id}
              onChange={handleChange}
              onKeyDown={(e) => handleEnter(e, dateRef)}
              className="form-select form-sm w-bank"
            >
              <option value="">選択</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  [{company.account_type}] {company.bank_name}（{company.bank_account}）
                </option>
              ))}
            </select>
          </div>

          <div className="form-item">
            <label className="form-label">日付</label>
            <input
              ref={dateRef}
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              onKeyDown={(e) => handleEnter(e, balanceRef)}
              className="form-control form-sm w-date"
            />
          </div>

          <div className="form-item">
            <label className="form-label">残高</label>
            <input
              ref={balanceRef}
              type="number"
              name="balance"
              value={form.balance}
              onChange={handleChange}
              onKeyDown={(e) => handleEnter(e, noteRef)}
              className="form-control form-sm w-amount"
            />
          </div>

          <div className="form-item form-note">
            <label className="form-label">メモ</label>
            <input
              ref={noteRef}
              type="text"
              name="note"
              value={form.note}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="form-control form-sm"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-submit">
            登録
          </button>
        </div>

        <div className="form-help">Enter：次 / Ctrl+Enter：登録</div>
      </form>

      {renderCashTable('使用中の口座（流動）', ryudoData)}
      {renderCashTable('定期預金', teikiData)}
    </div>
  );
};

export default CashPage;
