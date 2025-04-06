import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const MailListNotices = ({ month, startDate, endDate }) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editNotice, setEditNotice] = useState(null);

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

  const handleEdit = (id) => {
    const noticeToEdit = notices.find(item => item.id === id);
    setEditNotice(noticeToEdit);
  };

  const handleSave = () => {
    if (!editNotice || !editNotice.id) {
      console.error('通知IDが存在しません');
      return;
    }

    axios.put(`http://localhost:5000/mails/${editNotice.id}`, editNotice)
      .then(response => {
        console.log("通知が更新されました:", response.data);
        setNotices(notices.map(item => item.id === editNotice.id ? editNotice : item));
        setEditNotice(null);
      })
      .catch(error => console.error('更新に失敗:', error));
  };

  const handleDelete = (id) => {
    if (!id) {
      console.error("IDが渡されていません。削除できません。");
      return;
    }

    axios.delete(`http://localhost:5000/mails/${id}`)
      .then(response => {
        console.log("通知が削除されました:", response.data);
        setNotices(notices.filter(item => item.id !== id));
      })
      .catch(error => console.error('削除に失敗:', error));
  };

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <h2>通知一覧（{notices.length}件）</h2>

      {editNotice && (
        <div>
          <h3>通知情報修正</h3>
          <form>
            <label>
              受取日:
              <input
                type="date"
                value={editNotice.received_at?.slice(0, 10)}
                onChange={(e) => setEditNotice({ ...editNotice, received_at: e.target.value })}
              />
            </label>
            <label>
              取引先:
              <input
                type="text"
                value={editNotice.client_name || ''}
                onChange={(e) => setEditNotice({ ...editNotice, client_name: e.target.value })}
              />
            </label>
            <label>
              説明:
              <input
                type="text"
                value={editNotice.description || ''}
                onChange={(e) => setEditNotice({ ...editNotice, description: e.target.value })}
              />
            </label>
            <label>
              メモ:
              <input
                type="text"
                value={editNotice.note || ''}
                onChange={(e) => setEditNotice({ ...editNotice, note: e.target.value })}
              />
            </label>
            <button type="button" onClick={handleSave}>保存</button>
          </form>
        </div>
      )}

      <table className="table table-bordered">
        <thead className="table-dark">
          <tr>
            <th>受取日</th>
            <th>取引先</th>
            <th>説明</th>
            <th>メモ</th>
            <th>修正</th>
            <th>削除</th>
          </tr>
        </thead>
        <tbody>
          {notices.map((item, index) => (
            <tr key={index}>
              <td>{item.received_at ? format(new Date(item.received_at), 'MM/dd') : '---'}</td>
              <td>{item.client_name}</td>
              <td>{item.description}</td>
              <td>{item.note}</td>
              <td>
                <button
                  onClick={() => handleEdit(item.id)}
                  className="btn btn-secondary btn-sm"
                >
                  修正
                </button>
              </td>
              <td>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="btn btn-danger btn-sm"
                >
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

export default MailListNotices;
