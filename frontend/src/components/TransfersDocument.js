// TransfersDocument.jsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'NotoSansJP',
  src: '/fonts/NotoSansJP-Regular.ttf',
});

const formatDate = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return '―';
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const formatRange = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return '―';
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
};

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'NotoSansJP' },
  title: { fontSize: 16, textAlign: 'center', marginBottom: 15 },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#000',
  },
  cell: { padding: 4 },
  date: { width: '10%' },
  client: { width: '25%' },
  amount: { width: '15%', textAlign: 'right' },
  account: { width: '30%' },
  note: { width: '15%', fontSize: 7 },
  status: { width: '5%', textAlign: 'center' },
  summary: {
    marginTop: 20,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

// 取引先＋口座でグルーピング
const groupTransfers = (arr) => {
  return arr.reduce((acc, item) => {
    const client = item.client_name || '不明';
    const account =
      item.bank_account_name ||
      `${item.bank_name || ''}（${item.bank_account || '―'}）`;

    const key = `${client}__${account}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
};

const TransfersDocument = ({ transfers = [], startDate, endDate }) => {
  const list = Array.isArray(transfers)
    ? transfers.filter(
        (t) =>
          t &&
          typeof t.payment_date === 'string' &&
          !isNaN(new Date(t.payment_date)) &&
          typeof t.amount !== 'undefined'
      )
    : [];

  const grouped = groupTransfers(list);
  const total = list.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const rangeLabel =
    startDate && endDate
      ? `${formatRange(startDate)} ～ ${formatRange(endDate)}`
      : '';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>振込一覧表（{rangeLabel}）</Text>

        <View style={styles.headerRow}>
          <Text style={[styles.cell, styles.date]}>支払日</Text>
          <Text style={[styles.cell, styles.client]}>取引先</Text>
          <Text style={[styles.cell, styles.amount]}>金額</Text>
          <Text style={[styles.cell, styles.account]}>口座</Text>
          <Text style={[styles.cell, styles.note]}>備考</Text>
          <Text style={[styles.cell, styles.status]}>済</Text>
        </View>

        {Object.entries(grouped).map(([key, items], idx) => (
          <View key={idx}>
            {items.map((item, i) => (
              <View style={styles.row} key={`${idx}-${i}`}>
                <Text style={[styles.cell, styles.date]}>
                  {formatDate(item.payment_date)}
                </Text>
                <Text style={[styles.cell, styles.client]}>
                  {item.client_name}
                </Text>
                <Text style={[styles.cell, styles.amount]}>
                  {Number(item.amount).toLocaleString()}
                </Text>
                <Text style={[styles.cell, styles.account]}>
                  {item.bank_account_name ||
                    `${item.bank_name || ''}（${item.bank_account || '―'}）`}
                </Text>
                <Text style={[styles.cell, styles.note]}>
                  {[item.description, item.note]
                    .filter(Boolean)
                    .join(' / ') || '―'}
                </Text>
                <Text style={[styles.cell, styles.status]}>
                  {item.status === '振込済み' ? '✓' : ''}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.summary}>
          {list.length} 件　合計: {total.toLocaleString()} 円
        </Text>
      </Page>
    </Document>
  );
};

export default TransfersDocument;
