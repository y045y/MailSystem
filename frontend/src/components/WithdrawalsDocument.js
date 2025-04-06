import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// ✅ フォント登録
Font.register({
  family: 'NotoSansJP',
  src: '/fonts/NotoSansJP-Regular.ttf',
  fontStyle: 'normal',
});

// ✅ 日付変換（例：4/30）
const formatDate = (iso) => {
  if (!iso || typeof iso !== 'string') return '---';
  const date = new Date(iso);
  return isNaN(date.getTime()) ? '---' : `${date.getMonth() + 1}/${date.getDate()}`;
};

// ✅ 月ラベル（2025-04 → 4月分）
const formatMonthLabel = (monthStr) => {
  if (!monthStr) return '';
  const [, m] = monthStr.split('-');
  return `${parseInt(m, 10)}月分`;
};

// ✅ スタイル定義
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'NotoSansJP',
  },
  title: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  row: {
    flexDirection: 'row',
  },
  header: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  cell: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 4,
  },
  cellDate: { width: '7%' },
  cellClient: { width: '20%' },
  cellAmount: { width: '10%', textAlign: 'right' },
  cellAccount: { width: '33%' },
  cellNote: { width: '30%' },
  summary: {
    marginTop: 12,
    textAlign: 'right',
    fontSize: 11,
  },
});

// ✅ PDFドキュメント本体
const WithdrawalsDocument = ({ withdrawals = [], month }) => {
  const safeWithdrawals = withdrawals.filter(item =>
    item &&
    typeof item.payment_date === 'string' &&
    !isNaN(new Date(item.payment_date).getTime()) &&
    typeof item.amount !== 'undefined'
  );

  const total = safeWithdrawals.reduce((sum, t) => {
    const amt = Number(t.amount || 0);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  const monthLabel = formatMonthLabel(month);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>引落一覧帳票（{monthLabel}）</Text>

        <View style={styles.table}>
          {/* ヘッダー */}
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, styles.cellDate]}>引落日</Text>
            <Text style={[styles.cell, styles.cellClient]}>取引先</Text>
            <Text style={[styles.cell, styles.cellAmount]}>金額</Text>
            <Text style={[styles.cell, styles.cellAccount]}>口座</Text>
            <Text style={[styles.cell, styles.cellNote]}>備考</Text>
          </View>

          {/* 明細行 */}
          {safeWithdrawals.length === 0 ? (
            <View style={styles.row}>
              <Text style={[styles.cell, styles.cellDate]}>---</Text>
              <Text style={[styles.cell, styles.cellClient]}>データが存在しません</Text>
              <Text style={[styles.cell, styles.cellAmount]}></Text>
              <Text style={[styles.cell, styles.cellAccount]}></Text>
              <Text style={[styles.cell, styles.cellNote]}></Text>
            </View>
          ) : (
            safeWithdrawals.map((item, idx) => (
              <View style={styles.row} key={idx}>
                <Text style={[styles.cell, styles.cellDate]}>
                  {formatDate(item.payment_date)}
                </Text>
                <Text style={[styles.cell, styles.cellClient]}>
                  {item.client_name || '―'}
                </Text>
                <Text style={[styles.cell, styles.cellAmount]}>
                  {Number(item.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Text>
                <Text style={[styles.cell, styles.cellAccount]}>
                  {item.bank_account_name || (item.bank_name && item.bank_account ? `${item.bank_name}（${item.bank_account}）` : '―')}
                </Text>
                <Text style={[styles.cell, styles.cellNote]}>
                  {[item.description, item.note].filter(Boolean).join(' / ')}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* 件数・合計 */}
        <Text style={styles.summary}>
          {safeWithdrawals.length} 件　合計: {total.toLocaleString(undefined, { maximumFractionDigits: 0 })} 円
        </Text>
      </Page>
    </Document>
  );
};

export default WithdrawalsDocument;