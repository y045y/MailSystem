import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MailListNotices = ({ month, startDate, endDate }) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!month || !startDate || !endDate) return;

    setLoading(true);
    axios.get(`http://localhost:5000/mails/notices`, {
      params: {
        month,
        startDate,
        endDate
      }
    })
      .then(res => {
        setNotices(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("通知一覧の取得失敗:", err);
        setLoading(false);
      });
  }, [month, startDate, endDate]);

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <h2>通知一覧（{notices.length}件）</h2>
      <table border="1">
        <thead>
          <tr>
            <th>受取日</th>
            <th>取引先</th>
            <th>説明</th>
            <th>メモ</th>
          </tr>
        </thead>
        <tbody>
          {notices.map((item, index) => (
            <tr key={index}>
              <td>{item.received_at || '---'}</td>
              <td>{item.client_name}</td>
              <td>{item.description}</td>
              <td>{item.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MailListNotices;
