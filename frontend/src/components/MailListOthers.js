import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MailListOthers = ({ startDate, endDate }) => {
  const [others, setOthers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!startDate || !endDate) return;

    setLoading(true);

    axios.get('http://localhost:5000/mails/others', {
      params: { startDate, endDate },
    })
      .then(res => {
        setOthers(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("その他一覧の取得失敗:", err);
        setLoading(false);
      });
  }, [startDate, endDate]);

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <h2>その他一覧（{others.length}件）</h2>
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
          {others.map((item, index) => (
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

export default MailListOthers;
