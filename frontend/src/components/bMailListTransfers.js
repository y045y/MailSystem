import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { PDFDownloadLink } from '@react-pdf/renderer';
import TransfersDocument from './TransfersDocument';
import SummaryDocument from './SummaryDocument';
import { format } from 'date-fns';

const MailListTransfers = ({ month, startDate, endDate, reloadKey }) => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editTransfer, setEditTransfer] = useState(null);

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    transfers: [],
    withdrawals: [],
    balances: [],
  });

  const [clients, setClients] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [cashRecords, setCashRecords] = useState([]);

  // 取引先フィルタ（id で絞り込み）
  const [clientFilter, setClientFilter] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const [categories, setCategories] = useState([]);

  // 文字正規化（MailFormと同じ）
  const normalizeText = (value) => {
    return String(value || '')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/\s+/g, '');
  };

  // 取引先候補絞り込み（入力画面と同じロジック）
  const filteredClients = useMemo(() => {
    const keyword = normalizeText(clientFilter);

    if (!keyword) return clients;

    return clients.filter((client) => {
      const name = normalizeText(client.name);
      return name.includes(keyword);
    });
  }, [clients, clientFilter]);

  // ---------------------------
  // マスタ系ロード
  // ---------------------------
  useEffect(() => {
    axios
      .get('http://localhost:5000/clients')
      .then((res) => setClients(res.data))
      .catch((err) => console.error('取引先取得失敗:', err));

    axios
      .get('http://localhost:5000/company-master')
      .then((res) => setCompanies(res.data))
      .catch((err) => console.error('会社マスタ取得失敗:', err));

    axios
      .get('http://localhost:5000/cash-records')
      .then((res) => setCashRecords(res.data))
      .catch((err) => console.error('キャッシュ履歴取得失敗:', err));

    axios
      .get('http://localhost:5000/categories')
      .then((res) => setCategories(res.data))
      .catch((err) => console.error('費目取得失敗:', err));
  }, []);

  // ---------------------------
  // 振込一覧 + Summary 用データ
  // ---------------------------
  useEffect(() => {
    if (!startDate || !endDate) return;

    setLoading(true);
    axios
      .get('http://localhost:5000/mails/transfers', {
        params: { startDate, endDate },
      })
      .then((res) => {
        console.log('📥 transfers API raw:', res.data);

        const filtered = Array.isArray(res.data)
          ? res.data.filter(
              (item) =>
                item && typeof item.amount === 'number' && typeof item.payment_date === 'string'
            )
          : [];

        setTransfers(filtered);
        setSelectedClientId('');
        setClientFilter('');
        setSelectedCategoryId('');
        setDescriptionFilter('');
        setLoading(false);
      })
      .catch((err) => {
        console.error('振込一覧の取得失敗:', err);
        setLoading(false);
      });

    // Summary PDF 用
    setSummaryLoading(true);
    axios
      .get('http://localhost:5000/mails/transfer-withdrawal-summary', {
        params: { startDate, endDate },
      })
      .then((res) => {
        console.log('📦 summaryData.transfers sample:', res.data.transfers?.[0]);
        setSummaryData(res.data || { transfers: [], withdrawals: [], balances: [] });
        setSummaryLoading(false);
      })
      .catch((err) => {
        console.error('Summary PDF データ取得失敗:', err);
        setSummaryLoading(false);
      });
  }, [month, startDate, endDate, reloadKey]);

  // ---------------------------
  // 行操作
  // ---------------------------
  const handleEdit = (id) => {
    const target = transfers.find((t) => t.id === id);
    setEditTransfer(target ? { ...target } : null);
  };

  const handleSave = () => {
    if (!editTransfer?.id) return;

    axios
      .put(`http://localhost:5000/mails/${editTransfer.id}`, editTransfer)
      .then(() => {
        setTransfers((prev) =>
          prev.map((item) => (item.id === editTransfer.id ? editTransfer : item))
        );
        setEditTransfer(null);
      })
      .catch((err) => console.error('更新に失敗:', err));
  };

  const handleDelete = (id) => {
    if (!id) return;

    axios
      .delete(`http://localhost:5000/mails/${id}`)
      .then(() => {
        setTransfers((prev) => prev.filter((item) => item.id !== id));
      })
      .catch((err) => console.error('削除に失敗:', err));
  };

  const markAsPaid = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/mails/${id}/mark-paid`);
      setTransfers((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: '振込済み' } : item))
      );
    } catch (error) {
      console.error('振込済みへの更新失敗:', error);
    }
  };

  const markAsUnpaid = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/mails/${id}/mark-unpaid`);
      setTransfers((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: '未処理' } : item))
      );
    } catch (error) {
      console.error('未処理への更新失敗:', error);
    }
  };

  // ---------------------------
  // 残高計算（流動口座）
  // ---------------------------
  const groupLatestByAccountType = (cashRecords, companies, accountType) => {
    const latestByCompany = {};

    cashRecords
      .filter((r) => {
        const company = companies.find((c) => c.id === r.company_id);
        return company?.account_type === accountType;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach((r) => {
        if (!latestByCompany[r.company_id]) {
          latestByCompany[r.company_id] = r;
        }
      });

    return Object.values(latestByCompany)
      .map((r) => {
        const company = companies.find((c) => c.id === r.company_id);
        return company ? { company, latest: r } : null;
      })
      .filter(Boolean);
  };

  const grouped = groupLatestByAccountType(cashRecords, companies, '流動');
  const balances = grouped.map(({ company, latest }) => ({
    account_name: `${company.bank_name || ''}（${company.bank_account || ''}）`,
    balance: latest.balance,
  }));
  const totalCash = grouped.reduce((sum, { latest }) => sum + Number(latest.balance || 0), 0);

  // ---------------------------
  // 取引先フィルタ（id ベース）
  // ---------------------------
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const clientOk = selectedClientId ? Number(t.client_id) === Number(selectedClientId) : true;

      const categoryOk = selectedCategoryId
        ? Number(t.category_id) === Number(selectedCategoryId)
        : true;

      const keyword = normalizeText(descriptionFilter);
      const descText = normalizeText(`${t.description || ''}${t.note || ''}`);
      const descOk = keyword ? descText.includes(keyword) : true;

      return clientOk && categoryOk && descOk;
    });
  }, [transfers, selectedClientId, selectedCategoryId, descriptionFilter]);
  // ★ 表示中の振込の合計金額
  const totalAmount = useMemo(
    () => (filteredTransfers || []).reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [filteredTransfers]
  );

  if (loading) return <p>読み込み中...</p>;

  // ---------------------------
  // JSX
  // ---------------------------
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2>振込一覧（{filteredTransfers.length}件）</h2>

        {/* 取引先コンボ（id ベース） */}
        <div className="transfer-filter-line">
          <span>取引先:</span>
          <input
            type="text"
            list="transfer-client-list"
            className="form-control form-control-sm"
            style={{ width: '220px' }}
            placeholder="取引先検索"
            value={
              clients.find((client) => String(client.id) === String(selectedClientId))?.name ||
              clientFilter
            }
            onChange={(e) => {
              const inputValue = e.target.value;
              setClientFilter(inputValue);

              const selectedClient = clients.find((client) => client.name === inputValue);
              setSelectedClientId(selectedClient ? String(selectedClient.id) : '');
            }}
          />

          <datalist id="transfer-client-list">
            {filteredClients.map((client) => (
              <option key={client.id} value={client.name} />
            ))}
          </datalist>

          {/* ★ 説明で絞り込み */}
          <span className="ms-3">費目:</span>
          <select
            className="form-select form-select-sm"
            style={{ width: '160px' }}
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
          >
            <option value="">すべて</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <span className="ms-3">メモ検索:</span>
          <input
            type="text"
            className="form-control form-control-sm"
            style={{ width: '180px' }}
            placeholder="説明・メモ"
            value={descriptionFilter}
            onChange={(e) => setDescriptionFilter(e.target.value)}
          />
        </div>
      </div>

      {/* 編集フォーム */}
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
              <select
                value={editTransfer.client_id || ''}
                onChange={(e) => {
                  const clientId = parseInt(e.target.value, 10);
                  const client = clients.find((c) => c.id === clientId);

                  const accountName = client
                    ? `${client.bank_name || ''} ${client.bank_account || ''}`
                    : '';

                  setEditTransfer({
                    ...editTransfer,
                    client_id: clientId,
                    client_name: client?.name || '',
                    bank_account_name: accountName,
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
              口座（自動セット）:
              <input type="text" value={editTransfer.bank_account_name || ''} readOnly />
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
            <button
              type="button"
              onClick={() => setEditTransfer(null)}
              className="btn btn-secondary"
            >
              キャンセル
            </button>
          </form>
        </div>
      )}

      {/* PDF ボタン（react-pdf の Eo バグ対策で key を付けて都度再マウント） */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: 20 }}>
        {filteredTransfers.length > 0 && !summaryLoading ? (
          <>
            {balances.length > 0 && (
              <PDFDownloadLink
                key={`sum-${startDate}-${endDate}`}
                document={
                  <SummaryDocument
                    balances={balances}
                    transfers={summaryData.transfers || []}
                    withdrawals={summaryData.withdrawals || []}
                    totalCash={totalCash}
                    month={month}
                  />
                }
                fileName={`振込引落一覧_${month}.pdf`}
              >
                {({ loading }) => (
                  <button disabled={loading} className="btn btn-outline-success btn-sm">
                    {loading ? 'PDFを生成中...' : '振込＋引落帳票'}
                  </button>
                )}
              </PDFDownloadLink>
            )}

            <PDFDownloadLink
              key={`trans-${startDate}-${endDate}-${selectedClientId || 'ALL'}-${
                filteredTransfers.length
              }`}
              document={
                <TransfersDocument
                  transfers={filteredTransfers}
                  startDate={startDate}
                  endDate={endDate}
                />
              }
              fileName={`振込一覧_${startDate}_${endDate}.pdf`}
            >
              {({ loading }) => (
                <button disabled={loading} className="btn btn-outline-primary btn-sm">
                  {loading ? 'PDFを生成中...' : '振込一覧PDF'}
                </button>
              )}
            </PDFDownloadLink>
          </>
        ) : (
          <span>PDF出力対象なし</span>
        )}
      </div>

      {/* 一覧テーブル */}
      <table className="table table-bordered">
        <thead className="table-dark">
          <tr>
            <th>受取日</th>
            <th>支払日</th>
            <th>取引先</th>
            <th>金額</th>
            <th>口座</th>
            <th>説明</th>
            <th>メモ</th>
            <th>状態</th>
            <th>修正</th>
            <th>削除</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransfers.map((item) => (
            <tr key={item.id}>
              <td>{item.received_at ? format(new Date(item.received_at), 'M/dd') : '---'}</td>
              <td>{item.payment_date ? format(new Date(item.payment_date), 'M/dd') : '---'}</td>
              <td>{item.client_name}</td>
              <td>{item.amount.toLocaleString()}</td>
              <td>{item.bank_account_name}</td>
              <td>{item.description}</td>
              <td>{item.note}</td>
              <td>
                {item.status === '振込済み' ? (
                  <button
                    onClick={() => markAsUnpaid(item.id)}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    未処理に戻す
                  </button>
                ) : (
                  <button onClick={() => markAsPaid(item.id)} className="btn btn-success btn-sm">
                    振込済みにする
                  </button>
                )}
              </td>
              <td>
                <button onClick={() => handleEdit(item.id)} className="btn btn-secondary btn-sm">
                  修正
                </button>
              </td>
              <td>
                <button onClick={() => handleDelete(item.id)} className="btn btn-danger btn-sm">
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredTransfers.length > 0 && (
        <div className="text-end mt-2 fw-bold">合計：{totalAmount.toLocaleString()} 円</div>
      )}
    </div>
  );
};

export default MailListTransfers;
