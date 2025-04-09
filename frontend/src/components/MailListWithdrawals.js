import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { PDFDownloadLink } from '@react-pdf/renderer';
import WithdrawalsDocument from './WithdrawalsDocument'; // ← PDF帳票

const MailListWithdrawals = ({ startDate, endDate }) => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editWithdrawal, setEditWithdrawal] = useState(null);

  useEffect(() => {
    if (!startDate || !endDate) return;

    setLoading(true);
    axios.get('http://localhost:5000/mails/withdrawals', {
      params: { startDate, endDate },
    })
      .then((res) => {
        setWithdrawals(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('引落一覧の取得失敗:', err);
        setLoading(false);
      });
  }, [startDate, endDate]);

  const handleEdit = (id) => {
    const target = withdrawals.find((item) => item.id === id);
    setEditWithdrawal(target);
  };

  const handleSave = () => {
    if (!editWithdrawal?.id) return;

    axios.put(`http://localhost:5000/mails/${editWithdrawal.id}`, editWithdrawal)
      .then(() => {
        setWithdrawals(withdrawals.map((item) =>
          item.id === editWithdrawal.id ? editWithdrawal : item
        ));
        setEditWithdrawal(null);
      })
      .catch((error) => console.error('更新に失敗:', error));
  };

  const handleDelete = (id) => {
    if (!id) return;

    axios.delete(`http://localhost:5000/mails/${id}`)
      .then(() => {
        const updated = withdrawals.filter((item) => item.id !== id);
        setWithdrawals(updated);
      })
      .catch((error) => console.error('削除に失敗:', error));
  };

  if (loading) return <p>読み込み中...</p>;

  const month = startDate?.slice(0, 7) || '';

  return (
    <div>
      <h2>引落一覧（{withdrawals.length}件）</h2>

      {withdrawals.length > 0 && (
        <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
          <PDFDownloadLink
            document={<WithdrawalsDocument withdrawals={withdrawals} month={month} />}
            fileName={`引落一覧_${month}.pdf`}
          >
            {({ loading }) => (loading ? 'PDF生成中...' : 'PDFダウンロード')}
          </PDFDownloadLink>
        </div>
      )}

      {editWithdrawal && (
        <div>
          <h3>引落修正</h3>
          <form>
            <label>
              支払日:
              <input
                type="date"
                value={editWithdrawal.payment_date?.slice(0, 10) || ''}
                onChange={(e) =>
                  setEditWithdrawal({ ...editWithdrawal, payment_date: e.target.value })
                }
              />
            </label>
            <label>
              取引先:
              <input
                type="text"
                value={editWithdrawal.client_name || ''}
                onChange={(e) =>
                  setEditWithdrawal({ ...editWithdrawal, client_name: e.target.value })
                }
              />
            </label>
            <label>
              金額:
              <input
                type="number"
                value={editWithdrawal.amount || ''}
                onChange={(e) =>
                  setEditWithdrawal({ ...editWithdrawal, amount: e.target.value })
                }
              />
            </label>
            <label>
              口座:
              <input
                type="text"
                value={editWithdrawal.bank_account_name || ''}
                onChange={(e) =>
                  setEditWithdrawal({ ...editWithdrawal, bank_account_name: e.target.value })
                }
              />
            </label>
            <label>
              説明:
              <input
                type="text"
                value={editWithdrawal.description || ''}
                onChange={(e) =>
                  setEditWithdrawal({ ...editWithdrawal, description: e.target.value })
                }
              />
            </label>
            <label>
              メモ:
              <input
                type="text"
                value={editWithdrawal.note || ''}
                onChange={(e) =>
                  setEditWithdrawal({ ...editWithdrawal, note: e.target.value })
                }
              />
            </label>
            <button type="button" onClick={handleSave}>保存</button>
          </form>
        </div>
      )}

      {/* ✅ 引落一覧テーブル（修正済み） */}
      <table className="table table-bordered">
       <thead className="table-dark">
          <tr>
            <th>受取日</th> {/* ← 追加 */}
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
      <td>{item.received_at ? format(new Date(item.received_at), 'M/dd') : '―'}</td> {/* ← 追加 */}
      <td>{item.payment_date ? format(new Date(item.payment_date), 'M/dd') : '―'}</td>
      <td>{item.client_name || '―'}</td>
      <td>{item.amount?.toLocaleString() || 0}</td>
      <td>{item.bank_account_name || `${item.bank_name || ''}（${item.bank_account || ''}）` || '―'}</td>
      <td>{item.description || ''}</td>
      <td>{item.note || ''}</td>
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

export default MailListWithdrawals;
