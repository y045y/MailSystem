import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MailListOthers = ({ startDate, endDate }) => {
  const [others, setOthers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);  // 編集対象のアイテム

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

  // 編集ボタンが押された時の処理
  const handleEdit = (item) => {
    setEditItem(item);  // 編集対象をセット
  };

  // 編集内容を保存する処理
  const handleSave = () => {
    if (!editItem || !editItem.id) {
      console.error('アイテムIDが存在しません');
      return;
    }

    axios.put(`http://localhost:5000/mails/${editItem.id}`, editItem)
      .then(response => {
        console.log("アイテムが更新されました:", response.data);
        setOthers(others.map(item => item.id === editItem.id ? editItem : item));  // リストを更新
        setEditItem(null);  // 編集モードを終了
      })
      .catch(error => console.error('更新に失敗:', error));
  };

  // 削除処理
  const handleDelete = (id) => {
    console.log("削除対象ID:", id);

    if (!id) {
      console.error("IDが渡されていません。削除できません。");
      return;
    }

    axios.delete(`http://localhost:5000/mails/${id}`)
      .then(response => {
        console.log("アイテムが削除されました:", response.data);
        setOthers(others.filter(item => item.id !== id));  // リストから削除
      })
      .catch(error => console.error('削除に失敗:', error));
  };

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <h2>その他一覧（{others.length}件）</h2>

      {/* 編集フォーム */}
      {editItem && (
        <div>
          <h3>アイテム編集</h3>
          <form>
            <label>
              受取日:
              <input
                type="date"
                value={editItem.received_at?.slice(0, 10)}
                onChange={(e) => setEditItem({ ...editItem, received_at: e.target.value })}
              />
            </label>
            <label>
              取引先:
              <input
                type="text"
                value={editItem.client_name || ''}
                onChange={(e) => setEditItem({ ...editItem, client_name: e.target.value })}
              />
            </label>
            <label>
              説明:
              <input
                type="text"
                value={editItem.description || ''}
                onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
              />
            </label>
            <label>
              メモ:
              <input
                type="text"
                value={editItem.note || ''}
                onChange={(e) => setEditItem({ ...editItem, note: e.target.value })}
              />
            </label>
            <button type="button" onClick={handleSave}>保存</button>
          </form>
        </div>
      )}

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
          {others.map((item) => (
            <tr key={item.id}>
              <td>{item.received_at || '---'}</td>
              <td>{item.client_name}</td>
              <td>{item.description}</td>
              <td>{item.note}</td>
              <td>
                <button onClick={() => handleEdit(item)}>修正</button>
              </td>
              <td>
                <button onClick={() => handleDelete(item.id)}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MailListOthers;
