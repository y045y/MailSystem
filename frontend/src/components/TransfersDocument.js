import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'NotoSansJP',
  src: '/fonts/NotoSansJP-Regular.ttf',
  fontStyle: 'normal',
});

const formatDate = (iso) => {
  const date = new Date(iso);
  return isNaN(date) ? '―' : `${date.getMonth() + 1}/${date.getDate()}`;
};

const formatMonth = (monthStr) => {
  const [, m] = (monthStr || '').split('-');
  return `${parseInt(m || '0', 10)}月分`;
};

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'NotoSansJP' },
  title: { fontSize: 16, marginBottom: 15, textAlign: 'center' },
  header: {
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
  date: { width: '8%' },
  client: { width: '20%' },
  amount: { width: '10%', textAlign: 'right' },
  account: { width: '30%' },
  note: { width: '27%', fontSize: 7 },
  noteHeader: {
    width: '15%',
    fontSize: 10, // ← 通常サイズ
    fontWeight: 'bold',
  },

  status: { width: '5%', textAlign: 'center' },
  subtotal: {
    paddingTop: 2,
    paddingBottom: 2,
    textAlign: 'right',
    fontWeight: 'bold',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#000',
  },
  summary: {
    marginTop: 20,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

const groupTransfers = (array) => {
  return array.reduce((grouped, item) => {
    const client = item.client_name || '―';
    const account =
      item.bank_account_name || `${item.bank_name || ''}（${item.bank_account || '―'}）`;
    const key = `${client}__${account}`;
    grouped[key] ??= [];
    grouped[key].push(item);
    return grouped;
  }, {});
};

const TransfersDocument = ({ transfers = [], month }) => {
  const list = Array.isArray(transfers)
    ? transfers.filter(
        (item) =>
          item &&
          typeof item.payment_date === 'string' &&
          !isNaN(new Date(item.payment_date)) &&
          typeof item.amount !== 'undefined'
      )
    : [];

  const monthLabel = formatMonth(month);
  const grouped = groupTransfers(list);
  const total = list.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>振込一覧帳票（{monthLabel}）</Text>

        <View style={styles.header}>
          <Text style={[styles.cell, styles.date]}>支払日</Text>
          <Text style={[styles.cell, styles.client]}>取引先</Text>
          <Text style={[styles.cell, styles.amount]}>金額</Text>
          <Text style={[styles.cell, styles.account]}>口座</Text>
          <Text style={[styles.cell, styles.note]}>備考</Text>
          <Text style={[styles.cell, styles.status]}>済</Text>
        </View>

        {Object.entries(grouped).map(([groupKey, items], accIdx) => {
          const [clientName, accountName] = groupKey.split('__');
          const subtotal = items.reduce((sum, t) => sum + Number(t.amount || 0), 0);

          return (
            <View key={accIdx}>
              {items.map((item, i) => (
                <View style={styles.row} key={`${accIdx}-${i}`}>
                  <Text style={[styles.cell, styles.date]}>{formatDate(item.payment_date)}</Text>
                  <Text style={[styles.cell, styles.client]}>{item.client_name}</Text>
                  <Text style={[styles.cell, styles.amount]}>
                    {Number(item.amount).toLocaleString()}
                  </Text>
                  <Text style={[styles.cell, styles.account]}>
                    {item.bank_account_name ||
                      `${item.bank_name || ''}（${item.bank_account || '―'}）`}
                  </Text>
                  <Text style={[styles.cell, styles.note]} wrap={false}>
                    {[item.description, item.note].filter(Boolean).join(' / ') || '―'}
                  </Text>
                  <Text style={[styles.cell, styles.status]}>
                    {item.status === '振込済み' ? '✓' : ''}
                  </Text>
                </View>
              ))}

              {items.length > 1 && (
                <Text style={styles.subtotal}>
                  小計（{clientName} / {accountName}）: {subtotal.toLocaleString()} 円
                </Text>
              )}
            </View>
          );
        })}

        <Text style={styles.summary}>
          {list.length} 件 合計: {total.toLocaleString()} 円
        </Text>
      </Page>
    </Document>
  );
};

export default TransfersDocument;
