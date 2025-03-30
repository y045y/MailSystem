import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MailListNotices = ({ month, startDate, endDate }) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editNotice, setEditNotice] = useState(null); // 修正対象の通知情報

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

  // 修正ボタンを押したときの処理
  const handleEdit = (id) => {
    const noticeToEdit = notices.find(item => item.id === id);
    setEditNotice(noticeToEdit); // 編集対象の通知情報を設定
  };

  // 通知情報修正処理
  const handleSave = () => {
    if (!editNotice || !editNotice.id) {
      console.error('通知IDが存在しません');
      return;
    }

    axios.put(`http://localhost:5000/mails/${editNotice.id}`, editNotice)
      .then(response => {
        console.log("通知が更新されました:", response.data);
        setNotices(notices.map(item => item.id === editNotice.id ? editNotice : item));
        setEditNotice(null);  // 編集モードを終了
      })
      .catch(error => console.error('更新に失敗:', error));
  };

  // 削除処理
  const handleDelete = (id) => {
    console.log("削除対象ID:", id);  // IDが正しく渡っているか確認

    if (!id) {
      console.error("IDが渡されていません。削除できません。");
      return;
    }

    axios.delete(`http://localhost:5000/mails/${id}`)
      .then(response => {
        console.log("通知が削除されました:", response.data);
        setNotices(notices.filter(item => item.id !== id)); // リストから削除
      })
      .catch(error => console.error('削除に失敗:', error));
  };

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <h2>通知一覧（{notices.length}件）</h2>

      {/* 通知情報修正フォーム */}
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

      {/* 通知一覧の表示 */}
      <table border="1">
        <thead>
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
              <td>{item.received_at || '---'}</td>
              <td>{item.client_name}</td>
              <td>{item.description}</td>
              <td>{item.note}</td>
              <td>
                <button onClick={() => handleEdit(item.id)}>修正</button>  {/* 修正ボタン */}
              </td>
              <td>
                <button onClick={() => handleDelete(item.id)}>削除</button>  {/* 削除ボタン */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MailListNotices;
