import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { PDFDownloadLink } from '@react-pdf/renderer';
import TransfersDocument from './TransfersDocument';
import SummaryDocument from './SummaryDocument';
import { format } from 'date-fns';
import '../styles/MailList.css';
import '../styles/TableCommon.css';

const MailListTransfers = ({ month, startDate, endDate, reloadKey }) => {
  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    transfers: [],
    withdrawals: [],
    balances: [],
  });

  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [cashRecords, setCashRecords] = useState([]);

  const [typeFilter, setTypeFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');

  const normalizeText = (value) => {
    return String(value || '')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/\s+/g, '');
  };

  const formatShortDate = (value) => {
    if (!value) return '---';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '---';

    return format(date, 'M/dd');
  };

  const formatDateInput = (value) => {
    if (!value) return '';
    return String(value).slice(0, 10);
  };

  const toNullableNumber = (value) => {
    if (value === '' || value === null || typeof value === 'undefined') return null;
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? null : numberValue;
  };

  const makeAccountName = (bankName, bankAccount, emptyText = '') => {
    const safeBankName = bankName || '';
    const safeBankAccount = bankAccount || '';

    if (!safeBankName && !safeBankAccount) return emptyText;

    return `${safeBankName}（${safeBankAccount}）`;
  };

  const getTransferAccountName = (client) => {
    if (!client) return '';
    return makeAccountName(client.bank_name, client.bank_account, '振込先口座未登録');
  };

  const getWithdrawalAccountName = (client) => {
    if (!client) return '';
    if (!client.withdrawal_company) return '引落口座未登録';

    return makeAccountName(
      client.withdrawal_company.bank_name,
      client.withdrawal_company.bank_account,
      '引落口座未登録'
    );
  };

  const getAccountNameByType = (type, client) => {
    if (type === '振込') return getTransferAccountName(client);
    if (type === '引落') return getWithdrawalAccountName(client);
    return '';
  };

  const filteredClients = useMemo(() => {
    const keyword = normalizeText(clientFilter);

    if (!keyword) return clients;

    return clients.filter((client) => normalizeText(client.name).includes(keyword));
  }, [clients, clientFilter]);

  useEffect(() => {
    axios
      .get('http://localhost:5000/clients')
      .then((res) => setClients(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error('取引先取得失敗:', err));

    axios
      .get('http://localhost:5000/categories')
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error('費目取得失敗:', err));

    axios
      .get('http://localhost:5000/company-master')
      .then((res) => setCompanies(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error('会社マスタ取得失敗:', err));

    axios
      .get('http://localhost:5000/cash-records')
      .then((res) => setCashRecords(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error('キャッシュ履歴取得失敗:', err));
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) return;

    setLoading(true);

    axios
      .get('http://localhost:5000/mails', {
        params: {
          startDate,
          endDate,
        },
      })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];

        setMails(data);
        setEditingId(null);
        setForm({});

        setTypeFilter('');
        setSelectedClientId('');
        setClientFilter('');
        setSelectedCategoryId('');
        setDescriptionFilter('');

        setLoading(false);
      })
      .catch((err) => {
        console.error('郵便物一覧の取得失敗:', err);
        setLoading(false);
      });

    setSummaryLoading(true);

    axios
      .get('http://localhost:5000/mails/transfer-withdrawal-summary', {
        params: {
          startDate,
          endDate,
        },
      })
      .then((res) => {
        setSummaryData(res.data || { transfers: [], withdrawals: [], balances: [] });
        setSummaryLoading(false);
      })
      .catch((err) => {
        console.error('Summary PDF データ取得失敗:', err);
        setSummaryLoading(false);
      });
  }, [month, startDate, endDate, reloadKey]);

  const startEdit = (item) => {
    const client = clients.find((clientItem) => Number(clientItem.id) === Number(item.client_id));

    setEditingId(item.id);
    setForm({
      ...item,
      client_id: item.client_id ?? '',
      bank_account_id: item.bank_account_id ?? '',
      category_id: item.category_id ?? '',
      amount: item.amount ?? '',
      bank_account_name: item.bank_account_name || getAccountNameByType(item.type, client),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  const handleChangeType = (nextType) => {
    setForm((prev) => {
      const client = clients.find((clientItem) => Number(clientItem.id) === Number(prev.client_id));

      return {
        ...prev,
        type: nextType,
        bank_account_id: '',
        bank_account_name: getAccountNameByType(nextType, client),
      };
    });
  };

  const handleChangeClient = (clientIdValue) => {
    const clientId = toNullableNumber(clientIdValue);
    const client = clients.find((clientItem) => Number(clientItem.id) === Number(clientId));

    setForm((prev) => ({
      ...prev,
      client_id: clientId || '',
      client_name: client?.name || '',
      bank_account_id: '',
      bank_account_name: getAccountNameByType(prev.type, client),
    }));
  };

  const handleChangeCategory = (categoryIdValue) => {
    const categoryId = toNullableNumber(categoryIdValue);
    const category = categories.find(
      (categoryItem) => Number(categoryItem.id) === Number(categoryId)
    );

    setForm((prev) => ({
      ...prev,
      category_id: categoryId || '',
      category_name: category?.name || '',
    }));
  };

  const buildPayload = () => {
    return {
      ...form,
      client_id: toNullableNumber(form.client_id),
      bank_account_id: null,
      category_id: toNullableNumber(form.category_id),
      amount: form.amount === '' || form.amount === null ? 0 : Number(form.amount),
      received_at: form.received_at || null,
      payment_date: form.payment_date || null,
      description: form.description || '',
      note: form.note || '',
    };
  };

  const handleSave = () => {
    if (!form?.id) return;

    const payload = buildPayload();

    axios
      .put(`http://localhost:5000/mails/${form.id}`, payload)
      .then(() => {
        setMails((prev) => prev.map((item) => (item.id === form.id ? payload : item)));
        cancelEdit();
      })
      .catch((err) => console.error('更新に失敗:', err));
  };

  const handleDelete = (id) => {
    if (!id) return;
    if (!window.confirm('この郵便物を削除しますか？')) return;

    axios
      .delete(`http://localhost:5000/mails/${id}`)
      .then(() => {
        setMails((prev) => prev.filter((item) => item.id !== id));
      })
      .catch((err) => console.error('削除に失敗:', err));
  };

  const markAsPaid = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/mails/${id}/mark-paid`);

      setMails((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: '振込済み' } : item))
      );
    } catch (error) {
      console.error('振込済みへの更新失敗:', error);
    }
  };

  const markAsUnpaid = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/mails/${id}/mark-unpaid`);

      setMails((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: '未処理' } : item))
      );
    } catch (error) {
      console.error('未処理への更新失敗:', error);
    }
  };

  const groupLatestByAccountType = (records, companyList, accountType) => {
    const latestByCompany = {};

    records
      .filter((record) => {
        const company = companyList.find((item) => item.id === record.company_id);
        return company?.account_type === accountType;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach((record) => {
        if (!latestByCompany[record.company_id]) {
          latestByCompany[record.company_id] = record;
        }
      });

    return Object.values(latestByCompany)
      .map((record) => {
        const company = companyList.find((item) => item.id === record.company_id);
        return company ? { company, latest: record } : null;
      })
      .filter(Boolean);
  };

  const grouped = groupLatestByAccountType(cashRecords, companies, '流動');

  const balances = grouped.map(({ company, latest }) => ({
    account_name: `${company.bank_name || ''}（${company.bank_account || ''}）`,
    balance: Number(latest.balance || 0),
  }));

  const totalCash = grouped.reduce((sum, { latest }) => sum + Number(latest.balance || 0), 0);

  const filteredMails = useMemo(() => {
    return mails.filter((mail) => {
      const typeOk = typeFilter ? mail.type === typeFilter : true;

      const clientOk = selectedClientId
        ? Number(mail.client_id) === Number(selectedClientId)
        : true;

      const categoryOk = selectedCategoryId
        ? Number(mail.category_id) === Number(selectedCategoryId)
        : true;

      const keyword = normalizeText(descriptionFilter);
      const searchTarget = normalizeText(
        `${mail.description || ''}${mail.note || ''}${mail.client_name || ''}${mail.category_name || ''}`
      );
      const keywordOk = keyword ? searchTarget.includes(keyword) : true;

      return typeOk && clientOk && categoryOk && keywordOk;
    });
  }, [mails, typeFilter, selectedClientId, selectedCategoryId, descriptionFilter]);

  const totalAmount = useMemo(() => {
    return filteredMails.reduce((sum, mail) => {
      if (mail.type !== '振込' && mail.type !== '引落') return sum;
      return sum + Number(mail.amount || 0);
    }, 0);
  }, [filteredMails]);

  const pdfTransfers = useMemo(() => {
    return filteredMails.filter((mail) => mail.type === '振込');
  }, [filteredMails]);

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2>郵便一覧（{filteredMails.length}件）</h2>

        <div className="transfer-filter-line">
          <span>区分:</span>
          <select
            className="form-select form-control-sm"
            style={{ width: '140px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">すべて</option>
            <option value="振込">振込</option>
            <option value="引落">引落</option>
            <option value="通知">通知</option>
            <option value="その他">その他</option>
          </select>

          <span className="ms-3">取引先:</span>
          <input
            type="text"
            list="mail-client-list"
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

              const selectedClient = clients.find(
                (client) => normalizeText(client.name) === normalizeText(inputValue)
              );

              setSelectedClientId(selectedClient ? String(selectedClient.id) : '');
            }}
          />

          <datalist id="mail-client-list">
            {filteredClients.map((client) => (
              <option key={client.id} value={client.name} />
            ))}
          </datalist>

          <span className="ms-3">費目:</span>
          <select
            className="form-select form-control-sm"
            style={{ width: '160px' }}
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
          >
            <option value="">すべて</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: 20 }}>
        {editingId ? (
          <span className="text-muted">編集中はPDF出力できません</span>
        ) : filteredMails.length > 0 && !summaryLoading ? (
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
                {({ loading: pdfLoading }) => (
                  <button disabled={pdfLoading} className="btn btn-outline-success btn-sm">
                    {pdfLoading ? 'PDFを生成中...' : '振込＋引落帳票'}
                  </button>
                )}
              </PDFDownloadLink>
            )}

            {pdfTransfers.length > 0 && (
              <PDFDownloadLink
                key={`trans-${startDate}-${endDate}-${selectedClientId || 'ALL'}-${
                  selectedCategoryId || 'ALL'
                }-${pdfTransfers.length}`}
                document={
                  <TransfersDocument
                    transfers={pdfTransfers}
                    startDate={startDate}
                    endDate={endDate}
                  />
                }
                fileName={`振込一覧_${startDate}_${endDate}.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <button disabled={pdfLoading} className="btn btn-outline-primary btn-sm">
                    {pdfLoading ? 'PDFを生成中...' : '振込一覧PDF'}
                  </button>
                )}
              </PDFDownloadLink>
            )}
          </>
        ) : (
          <span>PDF出力対象なし</span>
        )}
      </div>

      <table className="table table-bordered mail-table">
        <thead className="table-dark">
          <tr>
            <th>区分</th>
            <th>受取日</th>
            <th>支払日</th>
            <th>取引先</th>
            <th>費目</th>
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
          {filteredMails.map((item) => {
            const isEditing = editingId === item.id;
            const isTransfer = item.type === '振込';
            const isPaymentType = item.type === '振込' || item.type === '引落';

            return (
              <tr key={item.id} className={isEditing ? 'editing-row' : ''}>
                {isEditing ? (
                  <>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={form.type || ''}
                        onChange={(e) => handleChangeType(e.target.value)}
                      >
                        <option value="">選択</option>
                        <option value="振込">振込</option>
                        <option value="引落">引落</option>
                        <option value="通知">通知</option>
                        <option value="その他">その他</option>
                      </select>
                    </td>

                    <td>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={formatDateInput(form.received_at)}
                        onChange={(e) => setForm({ ...form, received_at: e.target.value })}
                      />
                    </td>

                    <td>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={formatDateInput(form.payment_date)}
                        onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                      />
                    </td>

                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={form.client_id || ''}
                        onChange={(e) => handleChangeClient(e.target.value)}
                      >
                        <option value="">選択</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={form.category_id || ''}
                        onChange={(e) => handleChangeCategory(e.target.value)}
                      >
                        <option value="">選択</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm text-end"
                        value={form.amount ?? ''}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            amount: e.target.value,
                          })
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={form.bank_account_name || ''}
                        readOnly
                        placeholder="口座"
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={form.description || ''}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={form.note || ''}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                      />
                    </td>

                    <td>{form.status || '---'}</td>

                    <td>
                      <button type="button" onClick={handleSave} className="btn btn-primary btn-sm">
                        保存
                      </button>
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="btn btn-secondary btn-sm"
                      >
                        取消
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{item.type || '---'}</td>
                    <td>{formatShortDate(item.received_at)}</td>
                    <td>{formatShortDate(item.payment_date)}</td>
                    <td>{item.client_name || '---'}</td>
                    <td>{item.category_name || '---'}</td>
                    <td>{isPaymentType ? Number(item.amount || 0).toLocaleString() : '---'}</td>
                    <td>{item.bank_account_name || '---'}</td>
                    <td>{item.description || ''}</td>
                    <td>{item.note || ''}</td>

                    <td>
                      {isTransfer ? (
                        item.status === '振込済み' ? (
                          <button
                            type="button"
                            onClick={() => markAsUnpaid(item.id)}
                            className="btn btn-outline-secondary btn-sm"
                          >
                            未処理に戻す
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => markAsPaid(item.id)}
                            className="btn btn-success btn-sm"
                          >
                            振込済みにする
                          </button>
                        )
                      ) : (
                        item.status || '---'
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="btn btn-secondary btn-sm"
                      >
                        修正
                      </button>
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="btn btn-danger btn-sm"
                      >
                        削除
                      </button>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {filteredMails.length > 0 && (
        <div className="table-total">合計：{totalAmount.toLocaleString()} 円</div>
      )}
    </div>
  );
};

export default MailListTransfers;
