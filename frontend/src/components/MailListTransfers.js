import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MailListTransfers = ({ month, startDate, endDate, reloadKey }) => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!startDate || !endDate) return;

    setLoading(true);
    axios.get('http://localhost:5000/mails/transfers', {
      params: { startDate, endDate }
    })
      .then(res => {
        setTransfers(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("振込一覧の取得失敗:", err);
        setLoading(false);
      });
  }, [month, startDate, endDate, reloadKey]); 

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <h2>振込一覧（{transfers.length}件）</h2>
      <table border="1">
        <thead>
          <tr>
            <th>支払日</th>
            <th>取引先</th>
            <th>金額</th>
            <th>口座</th>
            <th>説明</th>
            <th>メモ</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((item, index) => (
            <tr key={index}>
              <td>{item.payment_date || '---'}</td>
              <td>{item.client_name}</td>
              <td>{item.amount}</td>
              <td>{item.bank_account_name}</td>
              <td>{item.description}</td>
              <td>{item.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MailListTransfers;
