import React, { useEffect, useState } from 'react';
import axios from 'axios';

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

  // 取引先一覧取得（withdrawal_companyを含む）
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

  // 自社口座一覧取得（セレクトボックス用）
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

  // 入力変更処理
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (editClient) {
      setEditClient({ ...editClient, [name]: value });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // 共通の登録/更新データ整形
  const getFormData = (source) => ({
    ...source,
    withdrawal_company_id: source.withdrawal_company_id
      ? Number(source.withdrawal_company_id)
      : null,
  });

  // 登録・更新送信
  const handleSubmit = async (e) => {
    e.preventDefault();
    const raw = editClient || form;
    const data = getFormData(raw);

    if (!data.name.trim() || !data.bank_account.trim()) {
      alert('取引先名と口座番号は必須です');
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

  // 編集開始
  const handleEdit = (client) => {
    setEditClient({
      ...client,
      withdrawal_company_id: client.withdrawal_company_id?.toString() || '',
    });
  };

  // 削除処理
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
    <div style={{ padding: '2rem' }}>
      <h2>取引先マスタ</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <input
          name="name"
          value={editClient ? editClient.name : form.name}
          onChange={handleChange}
          placeholder="取引先名"
          required
          style={{ width: '150px', marginRight: '10px' }}
        />
        <input
          name="bank_name"
          value={editClient ? editClient.bank_name : form.bank_name}
          onChange={handleChange}
          placeholder="銀行名"
          style={{ width: '150px', marginRight: '10px' }}
        />
        <input
          name="bank_account"
          value={editClient ? editClient.bank_account : form.bank_account}
          onChange={handleChange}
          placeholder="口座番号"
          required
          style={{ width: '150px', marginRight: '10px' }}
        />

<select
  name="withdrawal_company_id"
  value={
    (editClient
      ? editClient.withdrawal_company_id?.toString()
      : form.withdrawal_company_id?.toString()) || ''
  }
  onChange={handleChange}
  style={{ width: '200px', marginRight: '10px' }}
>
  <option value="">自社口座を選択</option>
  {companies.map((company) => (
    <option key={company.id} value={company.id.toString()}>
      {company.bank_name}（{company.bank_account}）
    </option>
  ))}
</select>


        <button type="submit">{editClient ? '保存' : '取引先追加'}</button>
        {editClient && (
          <button
            type="button"
            onClick={() => {
              setEditClient(null);
              setForm(initialForm);
            }}
            style={{ marginLeft: '10px' }}
          >
            キャンセル
          </button>
        )}
      </form>

      <table border="1" cellPadding="8">
        <thead>
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
              <td>{c.bank_name}</td>
              <td>{c.bank_account}</td>
              <td>
                {c.withdrawal_company
                  ? `${c.withdrawal_company.bank_name}（${c.withdrawal_company.bank_account}）`
                  : ''}
              </td>
              <td>
                <button onClick={() => handleEdit(c)}>修正</button>
                <button onClick={() => handleDelete(c.id)} style={{ marginLeft: '5px' }}>
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
