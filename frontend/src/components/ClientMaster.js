import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

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
  const [editClient, setEditClient] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await axios.get('http://localhost:5000/clients');
      setClients(res.data);
    } catch (err) {
      console.error('取引先一覧取得失敗:', err);
    }
  };

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get('http://localhost:5000/company-master');
        setCompanies(res.data);
      } catch (err) {
        console.error('自社情報の取得失敗:', err);
      }
    };
    fetchCompanies();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (editClient) {
      setEditClient({ ...editClient, [name]: value });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const getFormData = (source) => ({
    ...source,
    withdrawal_company_id: source.withdrawal_company_id
      ? Number(source.withdrawal_company_id)
      : null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const raw = editClient || form;
    const data = getFormData(raw);

    if (!data.name.trim()) {
      alert('取引先名は必須です');
      return;
    }

    try {
      if (editClient) {
        await axios.put(`http://localhost:5000/clients/${editClient.id}`, data);
        setEditClient(null);
      } else {
        await axios.post('http://localhost:5000/clients', data);
        setForm(initialForm);
      }
      fetchClients();
    } catch (err) {
      console.error('登録/更新失敗:', err);
    }
  };

  const handleEdit = (client) => {
    setEditClient({
      ...client,
      withdrawal_company_id: client.withdrawal_company_id?.toString() || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('本当に削除しますか？')) return;
    try {
      await axios.delete(`http://localhost:5000/clients/${id}`);
      fetchClients();
    } catch (err) {
      console.error('削除失敗:', err);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">取引先マスタ</h2>

      <form onSubmit={handleSubmit} className="row g-2 mb-4 align-items-end">
        <div className="col-auto">
          <label className="form-label">取引先名</label>
          <input
            name="name"
            value={(editClient ? editClient.name : form.name) ?? ''}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        <div className="col-auto">
          <label className="form-label">銀行名</label>
          <input
            name="bank_name"
            value={(editClient ? editClient.bank_name : form.bank_name) ?? ''}
            onChange={handleChange}
            className="form-control"
            placeholder="空欄可"
          />
        </div>
        <div className="col-auto">
          <label className="form-label">口座番号</label>
          <input
            name="bank_account"
            value={(editClient ? editClient.bank_account : form.bank_account) ?? ''}
            onChange={handleChange}
            className="form-control"
            placeholder="空欄可"
          />
        </div>
        <div className="col-auto">
          <label className="form-label">引落口座（自社）</label>
          <select
            name="withdrawal_company_id"
            value={
              (editClient
                ? editClient.withdrawal_company_id?.toString()
                : form.withdrawal_company_id?.toString()) || ''
            }
            onChange={handleChange}
            className="form-select"
          >
            <option value="">自社口座を選択</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id.toString()}>
                {company.bank_name}（{company.bank_account}）
              </option>
            ))}
          </select>
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-secondary">
            {editClient ? '保存' : '取引先追加'}
          </button>
          {editClient && (
            <button
              type="button"
              onClick={() => {
                setEditClient(null);
                setForm(initialForm);
              }}
              className="btn btn-outline-secondary ms-2"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      <table className="table table-bordered">
        <thead className="table-dark">
          <tr>
            <th>取引先名</th>
            <th>銀行名</th>
            <th>口座番号</th>
            <th>自社口座</th>
            <th>操作</th>
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
                <button className="btn btn-sm btn-secondary  me-2" onClick={() => handleEdit(c)}>
                  修正
                </button>
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
