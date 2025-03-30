import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MailList = () => {
  const [mails, setMails] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/mails')
      .then(response => setMails(response.data))
      .catch(error => console.error('郵便物一覧の取得に失敗:', error));
  }, []);

  return (
    <div>
      <h2>郵便物一覧</h2>
      <table border="1" cellPadding="8">
      <thead>
        <tr>
            <th>届いた日</th>
            <th>取引先</th>
            <th>種類</th>
            <th>支払日</th>
            <th>金額</th>
            <th>口座</th>
            <th>説明</th> {/* 追加 */}
            <th>メモ</th> {/* 追加 */}
            <th>ステータス</th>
        </tr>
        </thead>

        <tbody>
          {mails.map(mail => (
            <tr key={mail.id}>
              <td>{mail.received_at?.slice(0, 10)}</td>
              <td>{mail.Client?.name || '---'}</td>
              <td>{mail.type}</td>
              <td>{mail.payment_date || '---'}</td>
              <td>{mail.amount}</td>
              <td>{mail.BankAccount?.name || '---'}</td>
              <td>{mail.description || '---'}</td>
              <td>{mail.note || '---'}</td>
              <td>{mail.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MailList;
