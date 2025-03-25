import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MailListWithdrawals = ({ startDate, endDate }) => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!startDate || !endDate) return;

    setLoading(true);
    axios.get('http://localhost:5000/mails/withdrawals', {
      params: { startDate, endDate }
    })
      .then(res => {
        setWithdrawals(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("引落一覧の取得失敗:", err);
        setLoading(false);
      });
  }, [startDate, endDate]); // ← 範囲が変わるたびに再取得

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <h2>引落一覧（{withdrawals.length}件）</h2>
      <table border="1">
        <thead>
          <tr>
            <th>引落日</th>
            <th>取引先</th>
            <th>金額</th>
            <th>口座</th>
            <th>説明</th>
            <th>メモ</th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.map((item, index) => (
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

export default MailListWithdrawals;
