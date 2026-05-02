// MailForm.js
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/MailForm.css';

const MailForm = ({ onReload }) => {
  // ▼ 共通関数（先に書く）
  const getTodayJST = () => {
    const d = new Date();
    d.setHours(d.getHours() + 9);
    return d.toISOString().slice(0, 10);
  };

  const normalizeText = (value) => {
    return String(value || '')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/\s+/g, '');
  };

  const [formData, setFormData] = useState({
    received_at: getTodayJST(),
    sender: '',
    type: '',
    payment_date: '',
    amount: '',
    description: '',
    note: '',
    category_id: '',
    status: '未処理',
    bank_account_id: '',
  });

  const [clients, setClients] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [clientFilter, setClientFilter] = useState('');
  const [categories, setCategories] = useState([]);

  // 取引先マスタ取得
  useEffect(() => {
    axios
      .get('http://localhost:5000/clients')
      .then((response) => setClients(response.data))
      .catch((error) => console.error('クライアントデータの取得に失敗:', error));
  }, []);
  const filteredClients = useMemo(() => {
    const keyword = normalizeText(clientFilter);

    if (!keyword) return clients;

    return clients.filter((client) => {
      const name = normalizeText(client.name);
      return name.includes(keyword);
    });
  }, [clients, clientFilter]);
  //費目取得
  useEffect(() => {
    axios
      .get('http://localhost:5000/categories')
      .then((res) => setCategories(res.data))
      .catch((err) => console.error('費目取得失敗:', err));
  }, []);

  // 口座情報取得
  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        if (!formData.type || !formData.sender) {
          setBankAccounts([]);
          return;
        }

        const res = await axios.get(`http://localhost:5000/clients/${formData.sender}`);
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
        if (formData.type === '引落' || formData.type === 'カードの請求書') {
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
  const handleTypeChange = (e) => {
    const newType = e.target.value;

    setFormData((prev) => ({
      ...prev,
      type: newType,
      sender: '',
      bank_account_id: '',
      amount: '',
      payment_date: '',
    }));

    setClientFilter('');
    setBankAccounts([]);
  };

  // 送信
  const handleSubmit = (e) => {
    e.preventDefault();

    const dataToSend = {
      client_id: formData.sender ? parseInt(formData.sender, 10) : null,
      received_at: formData.received_at || null,
      payment_date: formData.payment_date || null,
      amount: formData.amount ? parseFloat(formData.amount) : 0,
      category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
      description: formData.description || '',
      note: formData.note || '',
      status: formData.status,
      type: formData.type,
      bank_account_id: formData.bank_account_id ? parseInt(formData.bank_account_id, 10) : null,
    };

    axios
      .post('http://localhost:5000/mails', dataToSend)
      .then((response) => {
        console.log('データが送信されました:', response.data);
        setFormData({
          received_at: getTodayJST(),
          sender: '',
          type: '',
          payment_date: '',
          amount: '',
          description: '',
          category_id: '',
          note: '',
          status: '未処理',
          bank_account_id: '',
        });
        setClientFilter('');
        setBankAccounts([]);
        if (onReload) onReload();
      })
      .catch((error) => {
        console.error('送信エラー:', error);
      });
  };
  const isPaymentType = formData.type === '振込' || formData.type === '引落';

  return (
    <form onSubmit={handleSubmit} className="mail-form card-form">
      {/* 1行目：基本項目 */}
      <div className="form-line">
        <div className="form-item">
          <label className="form-label">受取日</label>
          <input
            type="date"
            name="received_at"
            value={formData.received_at}
            onChange={handleChange}
            className="form-control form-sm w-date"
            required
          />
        </div>

        <div className="form-item">
          <label className="form-label">区　分</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleTypeChange}
            className="form-select form-sm w-type"
            required
          >
            <option value="">選択</option>
            <option value="引落">引落</option>
            <option value="振込">振込</option>
            <option value="通知">通知</option>
            <option value="その他">その他</option>
          </select>
        </div>

        <div className="form-item">
          <label className="form-label">取引先</label>
          <input
            type="text"
            list={formData.type ? 'client-list' : undefined}
            value={
              clients.find((client) => String(client.id) === String(formData.sender))?.name ||
              clientFilter
            }
            onFocus={(e) => {
              if (!formData.type) {
                e.target.blur();
                document.getElementById('type')?.focus();
              }
            }}
            readOnly={!formData.type}
            onChange={(e) => {
              if (!formData.type) return;

              const inputValue = e.target.value;
              setClientFilter(inputValue);

              const selectedClient = clients.find((client) => client.name === inputValue);

              setFormData((prev) => ({
                ...prev,
                sender: selectedClient ? String(selectedClient.id) : '',
                bank_account_id: '',
              }));
            }}
            className="form-control form-sm w-client"
            placeholder={formData.type ? '入力' : '区分先に選択'}
            required
          />
          <datalist id="client-list">
            {filteredClients.map((client) => (
              <option key={client.id} value={client.name} />
            ))}
          </datalist>
        </div>

        <div className="form-item">
          <label className="form-label">費目</label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className="form-select form-sm w-category"
            required
          >
            <option value="">選択</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2行目：支払系項目 */}
      <div className="form-line">
        <div className="form-item">
          <label className="form-label">金　額 </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="form-control form-sm w-amount"
            disabled={!isPaymentType}
            required={isPaymentType}
          />
        </div>

        <div className="form-item">
          <label className="form-label">支払日</label>
          <input
            type="date"
            name="payment_date"
            value={formData.payment_date}
            onChange={handleChange}
            className="form-control form-sm w-date"
            disabled={!isPaymentType}
            required={isPaymentType}
          />
        </div>

        <div className="form-item">
          <label className="form-label">口　座</label>
          <select
            name="bank_account_id"
            value={formData.bank_account_id}
            onChange={handleChange}
            className="form-select form-sm w-bank"
            disabled={!isPaymentType}
            required={isPaymentType}
          >
            <option value="">選択</option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3行目：メモ + 登録 */}
      <div className="form-line form-line-bottom">
        <div className="form-item form-note">
          <label className="form-label">メ　 モ</label>
          <input
            type="text"
            name="note"
            value={formData.note}
            onChange={handleChange}
            className="form-control form-sm"
          />
        </div>

        <button type="submit" className="btn btn-primary btn-submit">
          登録
        </button>
      </div>
    </form>
  );
};

export default MailForm;
