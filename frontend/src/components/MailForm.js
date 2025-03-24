import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MailForm = () => {
  const [formData, setFormData] = useState({
    received_at: '',
    sender: '', // 取引先のID
    type: '',
    payment_due_date: '',
    amount: '',
    description: '',
    note: '',
    status: '未処理',
  });

  const [clients, setClients] = useState([]); // 取引先のマスタデータを格納

  useEffect(() => {
    // クライアントデータをAPIから取得
    axios.get('http://localhost:5000/clients')
      .then(response => {
        setClients(response.data); // 取得したクライアントデータを状態に保存
      })
      .catch(error => {
        console.error('クライアントデータの取得に失敗:', error);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // フォームデータの処理
    const dataToSend = {
      ...formData,
      received_at: formData.received_at || null,
      payment_due_date: formData.payment_due_date || null,
    };

    // 送信先のAPIエンドポイント（バックエンドのURLに合わせてください）
    const apiUrl = 'http://localhost:5000/mails';

    // APIにPOSTリクエストを送信
    axios.post(apiUrl, dataToSend)
      .then(response => {
        console.log('データが送信されました:', response.data);
        setFormData({
          received_at: '',
          sender: '',
          type: '',
          payment_due_date: '',
          amount: '',
          description: '',
          note: '',
          status: '未処理'
        });
      })
      .catch(error => {
        console.error('エラー:', error);
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        届いた日:
        <input
          type="date"
          name="received_at"
          value={formData.received_at}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        取引先:
        <select
          name="sender"
          value={formData.sender}
          onChange={handleChange}
          required
        >
          <option value="">選択してください</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} {/* 取引先の名前（または適切なフィールド）を表示 */}
            </option>
          ))}
        </select>
      </label>
      <label>
        郵便物の種類:
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
        >
          <option value="">選択してください</option>
          <option value="引き落とし告知書">引き落とし告知書</option>
          <option value="請求書（振込）">請求書（振込）</option>
          <option value="お知らせ">お知らせ</option>
          <option value="納品書">納品書</option>
          <option value="カードの請求書">カードの請求書</option>
        </select>
      </label>
      <label>
        支払期限・引き落とし日:
        <input
          type="date"
          name="payment_due_date"
          value={formData.payment_due_date}
          onChange={handleChange}
        />
      </label>
      <label>
        金額:
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        説明:
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
      </label>
      <label>
        メモ:
        <input
          type="text"
          name="note"
          value={formData.note}
          onChange={handleChange}
        />
      </label>
      <button type="submit">送信</button>
    </form>
  );
};

export default MailForm;
