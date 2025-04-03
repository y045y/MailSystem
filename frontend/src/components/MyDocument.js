import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// NotoSansJPフォント登録
Font.register({
  family: 'NotoSansJP',
  src: '/fonts/NotoSansJP-Regular.ttf',
  fontStyle: 'normal',
});

// 日付を MM/DD 形式で表示
const formatDate = (iso) => {
  if (!iso) return '---';
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

// 月（YYYY-MM）→ 「4月分」形式に変換
const formatMonthLabel = (monthStr) => {
  if (!monthStr) return '';
  const [, m] = monthStr.split('-'); // "2025-04" → "04"
  return `${parseInt(m, 10)}月分`;
};

// スタイル定義
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
  cellDate: {
    width: '12%',
  },
  cellClient: {
    width: '18%',
  },
  cellAmount: {
    width: '12%',
    textAlign: 'right',
  },
  cellAccount: {
    width: '25%',
  },
  cellNote: {
    width: '33%',
  },
  summary: {
    marginTop: 12,
    textAlign: 'right',
    fontSize: 11,
  },
});

const MyDocument = ({ transfers, month }) => {
  const total = transfers.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const monthLabel = formatMonthLabel(month);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>振込一覧帳票（{monthLabel}）</Text>

        <View style={styles.table}>
          {/* ヘッダー */}
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, styles.cellDate]}>支払日</Text>
            <Text style={[styles.cell, styles.cellClient]}>取引先</Text>
            <Text style={[styles.cell, styles.cellAmount]}>金額</Text>
            <Text style={[styles.cell, styles.cellAccount]}>口座</Text>
            <Text style={[styles.cell, styles.cellNote]}>備考</Text>
          </View>

          {/* 明細 */}
          {transfers.map((item, idx) => (
            <View style={styles.row} key={idx}>
              <Text style={[styles.cell, styles.cellDate]}>{formatDate(item.payment_date)}</Text>
              <Text style={[styles.cell, styles.cellClient]}>{item.client_name || ''}</Text>
              <Text style={[styles.cell, styles.cellAmount]}>
                {item.amount ? Number(item.amount).toLocaleString() : ''}
              </Text>
              <Text style={[styles.cell, styles.cellAccount]}>{item.bank_account_name || ''}</Text>
              <Text style={[styles.cell, styles.cellNote]}>
                {(item.description || '') + ' ' + (item.note || '')}
              </Text>
            </View>
          ))}
        </View>

        {/* 件数と合計 */}
        <Text style={styles.summary}>
          {transfers.length} 件　合計: {total.toLocaleString()} 円
        </Text>
      </Page>
    </Document>
  );
};

export default MyDocument;
