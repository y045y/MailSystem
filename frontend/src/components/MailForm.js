// MailForm.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import '../styles/FormCommon.css';
import '../styles/MailForm.css';

const MailForm = ({ onReload }) => {
  const getTodayJST = () => {
    const d = new Date();
    d.setHours(d.getHours() + 9);
    return d.toISOString().slice(0, 10);
  };

  const normalizeText = (value) =>
    String(value || '')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/\s+/g, '');

  const toNumberOrNull = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  };

  const makeAccountName = (bankName, bankAccount, emptyText = '') => {
    if (!bankName && !bankAccount) return emptyText;
    return `${bankName || ''}（${bankAccount || ''}）`;
  };

  const getAccountNameByType = (type, client) => {
    if (!client) return '';

    if (type === '振込') {
      return makeAccountName(client.bank_name, client.bank_account, '振込先口座未登録');
    }

    if (type === '引落') {
      const company = client.withdrawal_company;
      if (!company) return '引落口座未登録';
      return makeAccountName(company.bank_name, company.bank_account, '引落口座未登録');
    }

    return '';
  };

  const initialForm = {
    received_at: getTodayJST(),
    type: '',
    client_id: '',
    payment_date: '',
    amount: '',
    category_id: '',
    bank_account_name: '',
    description: '',
    note: '',
    status: '未処理',
  };

  const [formData, setFormData] = useState(initialForm);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clientFilter, setClientFilter] = useState('');

  const receivedRef = useRef(null);
  const typeRef = useRef(null);
  const clientRef = useRef(null);
  const categoryRef = useRef(null);
  const amountRef = useRef(null);
  const paymentDateRef = useRef(null);
  const noteRef = useRef(null);
  const submitRef = useRef(null);

  const selectedClient = useMemo(() => {
    return clients.find((client) => String(client.id) === String(formData.client_id));
  }, [clients, formData.client_id]);

  const filteredClients = useMemo(() => {
    const keyword = normalizeText(clientFilter);
    if (!keyword) return clients;

    return clients.filter((client) => normalizeText(client.name).includes(keyword));
  }, [clients, clientFilter]);

  const isPaymentType = formData.type === '振込' || formData.type === '引落';

  useEffect(() => {
    axios
      .get('http://localhost:5000/clients')
      .then((res) => setClients(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error('取引先取得失敗:', err));

    axios
      .get('http://localhost:5000/categories')
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error('費目取得失敗:', err));
  }, []);

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

  const handleChangeType = (e) => {
    const nextType = e.target.value;

    setFormData((prev) => {
      const client = clients.find((item) => String(item.id) === String(prev.client_id));

      return {
        ...prev,
        type: nextType,
        amount: nextType === '振込' || nextType === '引落' ? prev.amount : '',
        payment_date: nextType === '振込' || nextType === '引落' ? prev.payment_date : '',
        bank_account_name: getAccountNameByType(nextType, client),
      };
    });
  };

  const handleClientInput = (e) => {
    const inputValue = e.target.value;
    setClientFilter(inputValue);

    const client = clients.find((item) => normalizeText(item.name) === normalizeText(inputValue));

    setFormData((prev) => ({
      ...prev,
      client_id: client ? String(client.id) : '',
      bank_account_name: client ? getAccountNameByType(prev.type, client) : '',
    }));
  };

  const handleSimpleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildPayload = () => ({
    client_id: toNumberOrNull(formData.client_id),
    received_at: formData.received_at || null,
    type: formData.type || null,
    payment_date: isPaymentType ? formData.payment_date || null : null,
    amount: isPaymentType ? Number(formData.amount || 0) : null,
    category_id: toNumberOrNull(formData.category_id),
    description: formData.description || '',
    note: formData.note || '',
    status: formData.status || '未処理',

    // 口座は client_master / withdrawal_company から参照するため、
    // mails.bank_account_id には保存しない。
    bank_account_id: null,
  });

  const resetAfterSubmit = () => {
    setFormData((prev) => ({
      ...initialForm,
      received_at: prev.received_at || getTodayJST(),
      type: prev.type,
      payment_date: prev.payment_date,
      category_id: prev.category_id,
    }));

    setClientFilter('');

    setTimeout(() => {
      moveFocus(clientRef);
    }, 0);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (!formData.type) {
      alert('区分を選択してください');
      moveFocus(typeRef);
      return;
    }

    if (!formData.client_id) {
      alert('取引先を選択してください');
      moveFocus(clientRef);
      return;
    }

    if (isPaymentType && !formData.payment_date) {
      alert('支払日を入力してください');
      moveFocus(paymentDateRef);
      return;
    }

    if (isPaymentType && !formData.amount) {
      alert('金額を入力してください');
      moveFocus(amountRef);
      return;
    }

    axios
      .post('http://localhost:5000/mails', buildPayload())
      .then(() => {
        resetAfterSubmit();
        if (onReload) onReload();
      })
      .catch((err) => {
        console.error('郵便物登録失敗:', err);
        alert('登録に失敗しました');
      });
  };

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <div className="form-line">
        <div className="form-item">
          <label className="form-label">受取日</label>
          <input
            ref={receivedRef}
            type="date"
            name="received_at"
            value={formData.received_at}
            onChange={handleSimpleChange}
            onKeyDown={(e) => handleEnter(e, typeRef)}
            className="form-control form-sm w-date"
            required
          />
        </div>

        <div className="form-item">
          <label className="form-label">区分</label>
          <select
            ref={typeRef}
            name="type"
            value={formData.type}
            onChange={handleChangeType}
            onKeyDown={(e) => handleEnter(e, clientRef)}
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
            ref={clientRef}
            type="text"
            list="client-list"
            value={selectedClient?.name || clientFilter}
            onChange={handleClientInput}
            onKeyDown={(e) => handleEnter(e, categoryRef)}
            className="form-control form-sm w-client"
            placeholder="取引先名"
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
            ref={categoryRef}
            name="category_id"
            value={formData.category_id}
            onChange={handleSimpleChange}
            onKeyDown={(e) => handleEnter(e, amountRef)}
            className="form-select form-sm w-category"
          >
            <option value="">選択</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-line">
        <div className="form-item">
          <label className="form-label">金額</label>
          <input
            ref={amountRef}
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleSimpleChange}
            onKeyDown={(e) => handleEnter(e, paymentDateRef)}
            className="form-control form-sm w-amount"
            disabled={!isPaymentType}
            required={isPaymentType}
          />
        </div>

        <div className="form-item">
          <label className="form-label">支払日</label>
          <input
            ref={paymentDateRef}
            type="date"
            name="payment_date"
            value={formData.payment_date}
            onChange={handleSimpleChange}
            onKeyDown={(e) => handleEnter(e, noteRef)}
            className="form-control form-sm w-date"
            disabled={!isPaymentType}
            required={isPaymentType}
          />
        </div>

        <div className="form-item">
          <label className="form-label">口座</label>
          <input
            type="text"
            value={formData.bank_account_name || ''}
            className="form-control form-sm w-bank"
            placeholder="取引先から自動表示"
            readOnly
          />
        </div>
      </div>

      <div className="form-line form-line-bottom">
        <div className="form-item form-note">
          <label className="form-label">メモ</label>
          <input
            ref={noteRef}
            type="text"
            name="note"
            value={formData.note}
            onChange={handleSimpleChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className="form-control form-sm"
          />
        </div>

        <button ref={submitRef} type="submit" className="btn btn-primary btn-submit">
          登録
        </button>
      </div>

      <div className="text-muted small mt-1">
        Enter：次項目 / メモ欄Enter：登録 / Ctrl+Enter：即登録
      </div>
    </form>
  );
};

export default MailForm;
