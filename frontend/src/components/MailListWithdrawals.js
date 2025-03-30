import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MailListWithdrawals = ({ startDate, endDate }) => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editWithdrawal, setEditWithdrawal] = useState(null);  // 修正対象の振込情報

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

    // 修正ボタンを押したときの処理
    const handleEdit = (id) => {
      const withdrawalToEdit = withdrawals.find(item => item.id === id);
      setEditWithdrawal(withdrawalToEdit);  // 編集対象の振込情報を設定
    };
  
    // 振込修正処理
    const handleSave = () => {
      if (!editWithdrawal || !editWithdrawal.id) {
        console.error('振込IDが存在しません');
        return;
      }
  
      axios.put(`http://localhost:5000/mails/${editWithdrawal.id}`, editWithdrawal)
        .then(response => {
          console.log("振込が更新されました:", response.data);
          setWithdrawals(withdrawals.map(item => item.id === editWithdrawal.id ? editWithdrawal : item));
          setEditWithdrawal(null);  // 編集モードを終了
        })
        .catch(error => console.error('更新に失敗:', error));
    };
    
  const handleDelete = (id) => {
    console.log("削除対象ID:", id);  // idが正しく渡っているか確認

    if (!id) {
      console.error("IDが渡されていません。削除できません。");
      return;
    }

    axios.delete(`http://localhost:5000/mails/${id}`)
      .then(response => {
        console.log("郵便物が削除されました:", response.data);
        setWithdrawals(withdrawals.filter(item => item.id !== id)); // リストから削除
      })
      .catch(error => console.error('削除に失敗:', error));
  };

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <h2>引落一覧（{withdrawals.length}件）</h2>

      {/* 振込修正フォーム */}
      {editWithdrawal && (
        <div>
          <h3>振込修正</h3>
          <form>
            <label>
              支払日:
              <input
                type="date"
                value={editWithdrawal.payment_date?.slice(0, 10)}
                onChange={(e) => setEditWithdrawal({ ...editWithdrawal, payment_date: e.target.value })}
              />
            </label>
            <label>
              取引先:
              <input
                type="text"
                value={editWithdrawal.client_name || ''}
                onChange={(e) => setEditWithdrawal({ ...editWithdrawal, client_name: e.target.value })}
              />
            </label>
            <label>
              金額:
              <input
                type="number"
                value={editWithdrawal.amount}
                onChange={(e) => setEditWithdrawal({ ...editWithdrawal, amount: e.target.value })}
              />
            </label>
            <label>
              口座:
              <input
                type="text"
                value={editWithdrawal.bank_account_name || ''}
                onChange={(e) => setEditWithdrawal({ ...editWithdrawal, bank_account_name: e.target.value })}
              />
            </label>
            <label>
              説明:
              <input
                type="text"
                value={editWithdrawal.description || ''}
                onChange={(e) => setEditWithdrawal({ ...editWithdrawal, description: e.target.value })}
              />
            </label>
            <label>
              メモ:
              <input
                type="text"
                value={editWithdrawal.note || ''}
                onChange={(e) => setEditWithdrawal({ ...editWithdrawal, note: e.target.value })}
              />
            </label>
            <button type="button" onClick={handleSave}>保存</button>
          </form>
        </div>
      )}

      {/* 引落一覧の表示 */}
      <table border="1">
        <thead>
          <tr>
            <th>引落日</th>
            <th>取引先</th>
            <th>金額</th>
            <th>口座</th>
            <th>説明</th>
            <th>メモ</th>
            <th>修正</th>
            <th>削除</th>
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

export default MailListWithdrawals;
