// MailForm.js
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/MailForm.css';

const MailForm = ({ onReload }) => {
  const [formData, setFormData] = useState({
    received_at: '',
    sender: '',            // ← client_id を入れる
    type: '',
    payment_date: '',
    amount: '',
    description: '',
    note: '',
    status: '未処理',
    bank_account_id: '',
  });

  const [clients, setClients] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [clientFilter, setClientFilter] = useState(''); // ★ 取引先キーワード

  // 取引先マスタ取得
  useEffect(() => {
    axios
      .get('http://localhost:5000/clients')
      .then((response) => setClients(response.data))
      .catch((error) => console.error('クライアントデータの取得に失敗:', error));
  }, []);

  // フィルタ後の取引先リスト（日本語もOK）
  const filteredClients = useMemo(() => {
    const keyword = clientFilter.trim();
    if (!keyword) return clients;
    return clients.filter((c) => c.name && c.name.includes(keyword));
  }, [clients, clientFilter]);

  // 口座情報取得
  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        if (!formData.type || !formData.sender) {
          setBankAccounts([]);
          return;
        }

        const res = await axios.get(
          `http://localhost:5000/clients/${formData.sender}`
        );
        const client = res.data;

        // 振込 → 取引先の振込口座
        if (formData.type === '振込') {
          if (client.bank_name && client.bank_account) {
            setBankAccounts([
              {
                id: client.id,
                name: `${client.bank_name}（${client.bank_account}）`,
              },
            ]);
          } else {
            setBankAccounts([]);
          }
          return;
        }

        // 引落・カード請求 → 取引先マスタに紐づく会社マスタ口座
        if (
          formData.type === '引落' ||
          formData.type === 'カードの請求書'
        ) {
          if (client.withdrawal_company) {
            setBankAccounts([
              {
                id: client.withdrawal_company.id,
                name: `${client.withdrawal_company.bank_name}（${client.withdrawal_company.bank_account}）`,
              },
            ]);
          } else {
            setBankAccounts([]);
          }
          return;
        }

        setBankAccounts([]);
      } catch (err) {
        console.error('口座情報の取得に失敗:', err);
        setBankAccounts([]);
      }
    };

    fetchBankAccounts();
  }, [formData.type, formData.sender]);

  // 共通 change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 送信
  const handleSubmit = (e) => {
    e.preventDefault();

    const dataToSend = {
      client_id: formData.sender ? parseInt(formData.sender, 10) : null,
      received_at: formData.received_at || null,
      payment_date: formData.payment_date || null,
      amount: formData.amount ? parseFloat(formData.amount) : 0,
      description: formData.description || '',
      note: formData.note || '',
      status: formData.status,
      type: formData.type,
      bank_account_id: formData.bank_account_id
        ? parseInt(formData.bank_account_id, 10)
        : null,
    };

    axios
      .post('http://localhost:5000/mails', dataToSend)
      .then((response) => {
        console.log('データが送信されました:', response.data);
        setFormData({
          received_at: '',
          sender: '',
          type: '',
          payment_date: '',
          amount: '',
          description: '',
          note: '',
          status: '未処理',
          bank_account_id: '',
        });
        setBankAccounts([]);
        if (onReload) onReload();
      })
      .catch((error) => {
        console.error('送信エラー:', error);
      });
  };

return (
  <form onSubmit={handleSubmit} className="mail-form p-3">
    <div className="row g-3 align-items-end">
      {/* 受取日 */}
      <div className="col-auto">
        <label className="form-label">受取日:</label>
        <input
          type="date"
          name="received_at"
          value={formData.received_at}
          onChange={handleChange}
          className="form-control form-control-sm"
          required
        />
      </div>

      {/* 取引先キーワード */}
      <div className="col-auto">
        <label className="form-label">取引先キーワード:</label>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="検索"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          style={{ width: '120px' }}
        />
      </div>

      {/* 取引先 */}
      <div className="col-auto">
        <label className="form-label">取引先:</label>
        <select
          name="sender"
          value={formData.sender}
          onChange={handleChange}
          className="form-select form-select-sm"
          required
          style={{ width: '180px' }}
        >
          <option value="">選択可</option>
          {filteredClients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {/* 金額 */}
      <div className="col-auto">
        <label className="form-label">金額:</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          className="form-control form-control-sm text-end"
          min="0"
          required={
            formData.type === '振込' ||
            formData.type === '引落' ||
            formData.type === 'カードの請求書'
          }
          style={{ width: '120px' }}
        />
      </div>

      {/* 支払日 */}
      <div className="col-auto">
        <label className="form-label">支払日:</label>
        <input
          type="date"
          name="payment_date"
          value={formData.payment_date}
          onChange={handleChange}
          className="form-control form-control-sm"
        />
      </div>

      {/* 区分 */}
      <div className="col-auto">
        <label className="form-label">区分:</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="form-select form-select-sm"
          required
          style={{ width: '110px' }}
        >
          <option value="">選択可</option>
          <option value="引落">引落</option>
          <option value="振込">振込</option>
          <option value="通知">通知</option>
          <option value="その他">その他</option>
        </select>
      </div>

      {/* 振込・引落口座 */}
      {(formData.type === '振込' ||
        formData.type === '引落' ||
        formData.type === 'カードの請求書') && (
        <div className="col-auto">
          <label className="form-label">振込・引落口座:</label>
          <select
            name="bank_account_id"
            value={formData.bank_account_id}
            onChange={handleChange}
            className="form-select form-select-sm"
            required
            style={{ width: '240px' }}
          >
            <option value="">選択可</option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 内容・費目 */}
      <div className="col-12 col-md-4">
        <label className="form-label">内容・費目:</label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="form-control form-control-sm"
        />
      </div>

      {/* メモ + 登録ボタン */}
      <div className="col-12 d-flex align-items-end">
        <div className="flex-grow-1 me-2">
          <label className="form-label">メモ:</label>
          <input
            type="text"
            name="note"
            value={formData.note}
            onChange={handleChange}
            className="form-control form-control-sm"
          />
        </div>

        <div className="pb-1">
          <button
            type="submit"
            className="btn btn-secondary"
            style={{ width: '160px' }}
          >
            登録
          </button>
        </div>
      </div>
    </div>
  </form>
);
};

export default MailForm;
