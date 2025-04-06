import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PDFDownloadLink } from '@react-pdf/renderer';
import MyDocument from './MyDocument';
import { format } from 'date-fns';


const MailListTransfers = ({ month, startDate, endDate, reloadKey }) => {
  const [transfers, setTransfers] = useState([]);
  const [pdfData, setPdfData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTransfer, setEditTransfer] = useState(null);

  useEffect(() => {
    if (!startDate || !endDate) return;

    setLoading(true);
    axios
      .get('http://localhost:5000/mails/transfers', {
        params: { startDate, endDate },
      })
      .then((res) => {
        const filtered = Array.isArray(res.data)
          ? res.data.filter(
              (item) =>
                item &&
                typeof item.amount === 'number' &&
                typeof item.payment_date === 'string'
            )
          : [];
        setTransfers(filtered);
        setPdfData(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.error('振込一覧の取得失敗:', err);
        setLoading(false);
      });
  }, [month, startDate, endDate, reloadKey]);

  const handleEdit = (id) => {
    const target = transfers.find((t) => t.id === id);
    setEditTransfer(target || null);
  };

  const handleSave = () => {
    if (!editTransfer?.id) return;

    axios
      .put(`http://localhost:5000/mails/${editTransfer.id}`, editTransfer)
      .then(() => {
        const updated = transfers.map((item) =>
          item.id === editTransfer.id ? editTransfer : item
        );
        setTransfers(updated);
        setPdfData(updated);
        setEditTransfer(null);
      })
      .catch((err) => console.error('更新に失敗:', err));
  };

  const handleDelete = (id) => {
    if (!id) return;

    axios
      .delete(`http://localhost:5000/mails/${id}`)
      .then(() => {
        const updated = transfers.filter((item) => item.id !== id);
        setTransfers(updated);
        setPdfData(updated);
      })
      .catch((err) => console.error('削除に失敗:', err));
  };

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <h2>振込一覧（{transfers.length}件）</h2>

      {editTransfer && (
        <div>
          <h3>振込編集</h3>
          <form>
            <label>
              支払日:
              <input
                type="date"
                value={editTransfer.payment_date?.slice(0, 10)}
                onChange={(e) =>
                  setEditTransfer({
                    ...editTransfer,
                    payment_date: e.target.value,
                  })
                }
              />
            </label>
            <label>
              取引先:
              <input
                type="text"
                value={editTransfer.client_name || ''}
                onChange={(e) =>
                  setEditTransfer({
                    ...editTransfer,
                    client_name: e.target.value,
                  })
                }
              />
            </label>
            <label>
              金額:
              <input
                type="number"
                value={editTransfer.amount}
                onChange={(e) =>
                  setEditTransfer({
                    ...editTransfer,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </label>
            <label>
              口座:
              <input
                type="text"
                value={editTransfer.bank_account_name || ''}
                onChange={(e) =>
                  setEditTransfer({
                    ...editTransfer,
                    bank_account_name: e.target.value,
                  })
                }
              />
            </label>
            <label>
              説明:
              <input
                type="text"
                value={editTransfer.description || ''}
                onChange={(e) =>
                  setEditTransfer({
                    ...editTransfer,
                    description: e.target.value,
                  })
                }
              />
            </label>
            <label>
              メモ:
              <input
                type="text"
                value={editTransfer.note || ''}
                onChange={(e) =>
                  setEditTransfer({
                    ...editTransfer,
                    note: e.target.value,
                  })
                }
              />
            </label>
            <button type="button" onClick={handleSave}>
              保存
            </button>
          </form>
        </div>
      )}

      <div style={{ textAlign: 'right', marginBottom: 20 }}>
        {pdfData.length > 0 ? (
          <PDFDownloadLink
            document={<MyDocument transfers={pdfData} month={month} />}
            fileName={`振込一覧_${month}.pdf`}
          >
            {({ loading }) =>
              loading ? 'PDFを生成中...' : 'PDFをダウンロード'
            }
          </PDFDownloadLink>
        ) : (
          <span>PDF出力対象なし</span>
        )}
      </div>

      <table border="1">
        <thead>
          <tr>
            <th>支払日</th>
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
          {transfers.map((item, index) => (
            <tr key={item.id || index}>
              <td>{item.payment_date ? format(new Date(item.payment_date), 'M/dd') : '---'}</td>
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
              {/* <td>
                <button onClick={() => handleEdit(item.id)}>修正</button>
                <button onClick={() => handleDelete(item.id)}>削除</button>
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MailListTransfers;
