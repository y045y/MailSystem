import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const CashPage = () => {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({
    company_id: '',
    date: '',
    balance: '',
    note: '',
    account_type: '流動',
  });
  const [cashRecords, setCashRecords] = useState([]);
  const [editRecord, setEditRecord] = useState(null);

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
    if (editRecord) {
      setEditRecord({ ...editRecord, [name]: value });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const raw = editRecord || form;
    const data = {
      ...raw,
      balance: Number(raw.balance),
    };

    try {
      if (editRecord) {
        await axios.put(`http://localhost:5000/cash-records/${editRecord.id}`, data);
        setEditRecord(null);
      } else {
        await axios.post('http://localhost:5000/cash-records', data);
        setForm({ company_id: '', date: '', balance: '', note: '', account_type: '流動' });
      }
      fetchCashRecords();
    } catch (err) {
      console.error('登録/更新失敗:', err);
    }
  };

  const handleEdit = (record) => {
    setEditRecord({ ...record });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('本当に削除しますか？')) return;
    try {
      await axios.delete(`http://localhost:5000/cash-records/${id}`);
      fetchCashRecords();
    } catch (err) {
      console.error('削除失敗:', err);
    }
  };

  const groupLatestByAccountType = (accountType) => {
    const latestByCompany = {};

    cashRecords
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach((r) => {
        if (!latestByCompany[r.company_id]) {
          latestByCompany[r.company_id] = r;
        }
      });

    return Object.values(latestByCompany)
      .filter((r) => r.account_type === accountType)
      .map((r) => ({
        company: companies.find((c) => c.id === r.company_id) || {},
        latest: r,
      }));
  };

  const ryudoData = groupLatestByAccountType('流動');
  const teikiData = groupLatestByAccountType('定期');
  const tsumikinData = groupLatestByAccountType('積金');

  const RenderCashTable = ({ title, data }) => {
    const total = data.reduce((sum, d) => sum + (d.latest?.balance || 0), 0);

    return (
      <>
        <h4 className="mt-4">{title}</h4>
        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th>自社口座</th>
              <th>最新日付</th>
              <th>残高</th>
              <th>メモ</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {data.map(({ company, latest }) => (
              <tr key={latest.id}>
                <td>
                  {company.bank_name}（{company.bank_account}）
                </td>
                <td>{latest?.date || '-'}</td>
                <td>{latest?.balance?.toLocaleString() || '0'} 円</td>
                <td>{latest?.note || ''}</td>
                <td>
                  {latest && (
                    <>
                      <button
                        className="btn btn-sm btn-secondary me-2"
                        onClick={() => handleEdit(latest)}
                      >
                        修正
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(latest.id)}
                      >
                        削除
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            <tr className="table-secondary fw-bold">
              <td colSpan="3">合計</td>
              <td>{total.toLocaleString()} 円</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </>
    );
  };

  return (
    <div className="container">
      <h2 className="my-3">キャッシュ管理</h2>

      <form onSubmit={handleSubmit} className="row g-2 mb-4 align-items-end">
        <div className="col-auto">
          <label className="form-label">自社口座</label>
          <select
            name="company_id"
            value={(editRecord ? editRecord.company_id : form.company_id) ?? ''}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">選択してください</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.account_type}] {c.bank_name}（{c.bank_account}）
              </option>
            ))}
          </select>
        </div>
        <div className="col-auto">
          <label className="form-label">口座区分</label>
          <select
            name="account_type"
            value={(editRecord ? editRecord.account_type : form.account_type) ?? '流動'}
            onChange={handleChange}
            className="form-select"
          >
            <option value="流動">流動</option>
            <option value="定期">定期</option>
            <option value="積金">積金</option>
          </select>
        </div>
        <div className="col-auto">
          <label className="form-label">日付</label>
          <input
            type="date"
            name="date"
            value={(editRecord ? editRecord.date : form.date) ?? ''}
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
            value={(editRecord ? editRecord.balance : form.balance) ?? ''}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        <div className="col-auto">
          <label className="form-label">メモ</label>
          <input
            name="note"
            value={(editRecord ? editRecord.note : form.note) ?? ''}
            onChange={handleChange}
            className="form-control"
          />
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-primary">
            {editRecord ? '保存' : '追加'}
          </button>
          {editRecord && (
            <button
              type="button"
              onClick={() => {
                setEditRecord(null);
                setForm({ company_id: '', date: '', balance: '', note: '', account_type: '流動' });
              }}
              className="btn btn-outline-secondary ms-2"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      <RenderCashTable title="使用中の口座（流動）" data={ryudoData} />
      <RenderCashTable title="定期預金" data={teikiData} />
      <RenderCashTable title="積金" data={tsumikinData} />
    </div>
  );
};

export default CashPage;
