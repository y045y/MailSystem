import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { PDFDownloadLink } from '@react-pdf/renderer';
import WithdrawalsDocument from './WithdrawalsDocument';

const MailListWithdrawals = ({ startDate, endDate, reloadKey, readOnly = false }) => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editWithdrawal, setEditWithdrawal] = useState(null);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    axios
      .get('http://localhost:5000/clients')
      .then((res) => setClients(res.data))
      .catch((err) => console.error('取引先取得失敗:', err));
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) return;

    setLoading(true);
    axios
      .get('http://localhost:5000/mails/withdrawals', {
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
  }, [startDate, endDate, reloadKey]); // ← reloadKeyを追加

  const handleEdit = (id) => {
    const target = withdrawals.find((item) => item.id === id);
    setEditWithdrawal(target);
  };
const handleSave = () => {
  if (!editWithdrawal?.id) return;

  const matchedClient = clients.find((c) => c.id === editWithdrawal.client_id);
  const correctedBankAccountId = matchedClient?.withdrawal_company?.id || null;

  const dataToUpdate = {
    type: '引落',
    status: editWithdrawal.status || '未処理',
    payment_date: editWithdrawal.payment_date,
    client_id: editWithdrawal.client_id,
    amount: editWithdrawal.amount,
    description: editWithdrawal.description || '',
    note: editWithdrawal.note || '',
    bank_account_id: correctedBankAccountId, // ← ここで明示的に再代入
  };

  axios
    .put(`http://localhost:5000/mails/${editWithdrawal.id}`, dataToUpdate)
    .then(() => {
      const bankAccountName = matchedClient?.withdrawal_company
        ? `${matchedClient.withdrawal_company.bank_name}（${matchedClient.withdrawal_company.bank_account}）`
        : '';

      const updated = withdrawals.map((item) =>
        item.id === editWithdrawal.id
          ? {
              ...item,
              ...editWithdrawal,
              bank_account_id: correctedBankAccountId,
              bank_account_name: bankAccountName,
            }
          : item
      );

      setWithdrawals(updated);
      setEditWithdrawal(null);
    })
    .catch((error) => console.error('更新に失敗:', error));
};


  const handleDelete = (id) => {
    if (!id) return;

    axios
      .delete(`http://localhost:5000/mails/${id}`)
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

      {!readOnly && editWithdrawal && (
        <div>
          <h3>引落修正</h3>
          <form>
            <label>
              引落日:
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
              <select
                value={editWithdrawal.client_id || ''}
                onChange={(e) => {
                  const clientId = parseInt(e.target.value, 10);
                  const client = clients.find((c) => c.id === clientId);

                  const accountName = client?.withdrawal_company
                    ? `${client.withdrawal_company.bank_name || ''} ${
                        client.withdrawal_company.bank_account || ''
                      }`
                    : '';

                    setEditWithdrawal({
                    ...editWithdrawal,
                    client_id: clientId,
                    client_name: client?.name || '',
                    bank_account_name: accountName,
                    bank_account_id: client?.withdrawal_company?.id || null,  // ← これが保存される
                  });

                }}
              >
                <option value="">選択してください</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              金額:
              <input
                type="number"
                value={editWithdrawal.amount || ''}
                onChange={(e) =>
                  setEditWithdrawal({ ...editWithdrawal, amount: parseFloat(e.target.value) || 0 })
                }
              />
            </label>

            <label>
              自社口座（自動セット）:
              <input type="text" value={editWithdrawal.bank_account_name || ''} readOnly />
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
                onChange={(e) => setEditWithdrawal({ ...editWithdrawal, note: e.target.value })}
              />
            </label>

            <div style={{ marginTop: '10px' }}>
              <button type="button" onClick={handleSave} className="btn btn-primary me-2">
                保存
              </button>
              <button
                type="button"
                onClick={() => setEditWithdrawal(null)}
                className="btn btn-secondary"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="table table-bordered">
        <thead className="table-dark">
          <tr>
            <th>受取日</th>
            <th>引落日</th>
            <th>取引先</th>
            <th>金額</th>
            <th>口座</th>
            <th>説明</th>
            <th>メモ</th>
            {!readOnly && <th>修正</th>}
            {!readOnly && <th>削除</th>}
          </tr>
        </thead>

        <tbody>
          {withdrawals.map((item, index) => (
            <tr key={index}>
              <td>{item.received_at ? format(new Date(item.received_at), 'M/dd') : '―'}</td>
              <td>{item.payment_date ? format(new Date(item.payment_date), 'M/dd') : '―'}</td>
              <td>{item.client_name || '―'}</td>
              <td>{item.amount?.toLocaleString() || 0}</td>
              <td>
                {item.bank_account_name ||
                  `${item.bank_name || ''}（${item.bank_account || ''}）` ||
                  '―'}
              </td>
              <td>{item.description || ''}</td>
              <td>{item.note || ''}</td>
              {!readOnly && (
                <>
                  <td>
                    <button
                      onClick={() => handleEdit(item.id)}
                      className="btn btn-secondary btn-sm"
                    >
                      修正
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(item.id)} className="btn btn-danger btn-sm">
                      削除
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MailListWithdrawals;
