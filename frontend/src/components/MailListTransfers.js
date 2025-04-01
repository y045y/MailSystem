import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PDFDownloadLink, Document, Page, Text, StyleSheet, View, Font } from '@react-pdf/renderer';

// 日本語フォントの登録
Font.register({
  family: 'NotoSansJP',
  src: '/fonts/NotoSansJP-Regular.ttf', // フォントファイルのパス
});

// スタイルの定義
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'NotoSansJP',  // 日本語フォントを指定
  },
  text: {
    fontSize: 14,
    marginBottom: 10,
    fontFamily: 'NotoSansJP',  // 日本語フォントを指定
  },
  table: {
    display: 'table',
    width: '100%',
    marginTop: 20,
    borderCollapse: 'collapse',  // ボーダーを重ねないように
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid black',  // 行間にボーダーを追加
  },
  tableCell: {
    width: '16.66%',
    padding: 8,  // セル内の余白を調整
    textAlign: 'center',
    border: '1px solid black',
    fontSize: 10,  // フォントサイズを調整
  },
  tableHeader: {
    fontWeight: 'bold',
    fontSize: 12,  // ヘッダーのフォントサイズを大きくする
  },
  tableButton: {
    marginTop: 20,
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
});

const MailListTransfers = ({ month, startDate, endDate, reloadKey }) => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTransfer, setEditTransfer] = useState(null); // 編集対象の振込

  // 振込一覧の取得
  useEffect(() => {
    if (!startDate || !endDate) return;

    setLoading(true);
    axios.get('http://localhost:5000/mails/transfers', {
      params: { startDate, endDate }
    })
      .then(res => {
        setTransfers(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("振込一覧の取得失敗:", err);
        setLoading(false);
      });
  }, [month, startDate, endDate, reloadKey]);

  // 修正ボタンを押したときの処理
  const handleEdit = (id) => {
    const transferToEdit = transfers.find(transfer => transfer.id === id);
    if (transferToEdit) {
      setEditTransfer(transferToEdit);  // 編集対象の振込データを設定
    } else {
      console.error("編集対象の振込が見つかりません");
    }
  };

  // 振込修正処理
  const handleSave = () => {
    if (!editTransfer || !editTransfer.id) {
      console.error('振込IDが存在しません');
      return;
    }

    axios.put(`http://localhost:5000/mails/${editTransfer.id}`, editTransfer)
      .then(response => {
        console.log("振込が更新されました:", response.data);
        setTransfers(transfers.map(item => item.id === editTransfer.id ? editTransfer : item));
        setEditTransfer(null);  // 編集モードを終了
      })
      .catch(error => console.error('更新に失敗:', error));
  };

  const handleDelete = (id) => {
    console.log("削除対象ID:", id);  // ここでidが正しく渡っているか確認

    if (!id) {
      console.error("IDが渡されていません。削除できません。");
      return;  // IDが渡されていない場合は処理を中止
    }

    // 削除リクエストを送信
    axios.delete(`http://localhost:5000/mails/${id}`)
      .then(response => {
        console.log("郵便物が削除されました:", response.data);

        // 削除後にリストを更新
        setTransfers(transfers.filter(item => item.id !== id));  // 削除した郵便物をリストから削除
      })
      .catch(error => {
        // エラーハンドリング
        console.error('削除に失敗:', error);
      });
  };

  // PDF出力用のDocument
  const MyDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.text}>振込一覧</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableHeader]}>支払日</Text>
            <Text style={[styles.tableCell, styles.tableHeader]}>取引先</Text>
            <Text style={[styles.tableCell, styles.tableHeader]}>金額</Text>
            <Text style={[styles.tableCell, styles.tableHeader]}>口座</Text>
            <Text style={[styles.tableCell, styles.tableHeader]}>説明</Text>
            <Text style={[styles.tableCell, styles.tableHeader]}>メモ</Text>
          </View>
          {transfers.map(transfer => (
            <View key={transfer.id} style={styles.tableRow}>
              <Text style={styles.tableCell}>{transfer.payment_date}</Text>
              <Text style={styles.tableCell}>{transfer.client_name}</Text>
              <Text style={styles.tableCell}>{transfer.amount}</Text>
              <Text style={styles.tableCell}>{transfer.bank_account_name}</Text>
              <Text style={styles.tableCell}>{transfer.description}</Text>
              <Text style={styles.tableCell}>{transfer.note}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <h2>振込一覧（{transfers.length}件）</h2>
      
      {/* 振込修正フォーム */}
      {editTransfer && (
        <div>
          <h3>振込編集</h3>
          <form>
            <label>
              支払日:
              <input
                type="date"
                value={editTransfer.payment_date?.slice(0, 10)}
                onChange={(e) => setEditTransfer({ ...editTransfer, payment_date: e.target.value })}
              />
            </label>
            <label>
              取引先:
              <input
                type="text"
                value={editTransfer.client_name || ''}
                onChange={(e) => setEditTransfer({ ...editTransfer, client_name: e.target.value })}
              />
            </label>
            <label>
              金額:
              <input
                type="number"
                value={editTransfer.amount}
                onChange={(e) => setEditTransfer({ ...editTransfer, amount: e.target.value })}
              />
            </label>
            <label>
              口座:
              <input
                type="text"
                value={editTransfer.bank_account_name || ''}
                onChange={(e) => setEditTransfer({ ...editTransfer, bank_account_name: e.target.value })}
              />
            </label>
            <label>
              説明:
              <input
                type="text"
                value={editTransfer.description || ''}
                onChange={(e) => setEditTransfer({ ...editTransfer, description: e.target.value })}
              />
            </label>
            <label>
              メモ:
              <input
                type="text"
                value={editTransfer.note || ''}
                onChange={(e) => setEditTransfer({ ...editTransfer, note: e.target.value })}
              />
            </label>
            <button type="button" onClick={handleSave}>保存</button>
          </form>
        </div>
      )}

      {/* 振込一覧の表示 */}
      <div style={{ textAlign: 'right', marginBottom: 20 }}>
        <PDFDownloadLink document={<MyDocument />} fileName="transfers_list.pdf">
          {({ loading }) => (loading ? 'PDFを生成中...' : 'PDFをダウンロード')}
        </PDFDownloadLink>
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
          </tr>
        </thead>
        <tbody>
          {transfers.map((item, index) => (
            <tr key={index}>
              <td>{item.payment_date || '---'}</td>
              <td>{item.client_name}</td>
              <td>{item.amount}</td>
              <td>{item.bank_account_name}</td>
              <td>{item.description}</td>
              <td>{item.note}</td>
              <td>
                <button onClick={() => handleEdit(item.id)}>修正</button>
                <button onClick={() => handleDelete(item.id)}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MailListTransfers;
