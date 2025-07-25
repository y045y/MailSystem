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
  cell: {
    padding: 4,
  },
  date: {
    width: '10%',
  },
  client: {
    width: '25%',
  },
  amount: {
    width: '15%',
    textAlign: 'right',
  },
  note: {
    width: '50%',
    fontSize: 7,
    overflow: 'hidden',
  },
  subtotal: {
    paddingTop: 2,
    paddingBottom: 2,
    textAlign: 'right',
    fontWeight: 'bold',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#000',
  },
  bankTotal: {
    marginTop: 4,
    paddingTop: 2,
    paddingBottom: 2,
    textAlign: 'right',
    fontWeight: 'bold',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  summary: {
    marginTop: 20,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

const groupNested = (items) => {
  const result = {};
  for (const item of items) {
    const account =
      item.bank_account_name || `${item.bank_name || ''}（${item.bank_account || '―'}）`;
    const client = item.client_name || '―';
    result[account] ??= {};
    result[account][client] ??= [];
    result[account][client].push(item);
  }
  return result;
};

const WithdrawalsPagedDocument = ({ withdrawals = [], month }) => {
  const list = withdrawals.filter(
    (w) =>
      w &&
      typeof w.payment_date === 'string' &&
      !isNaN(new Date(w.payment_date)) &&
      typeof w.amount !== 'undefined'
  );

  const grouped = groupNested(list);
  const total = list.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const monthLabel = formatMonth(month);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>引落一覧帳票（{monthLabel}）</Text>

        <View style={styles.header}>
          <Text style={[styles.cell, styles.date]}>引落日</Text>
          <Text style={[styles.cell, styles.client]}>取引先</Text>
          <Text style={[styles.cell, styles.amount]}>金額</Text>
          <Text style={[styles.cell, styles.note]}>備考</Text>
        </View>

        {Object.entries(grouped).map(([accountName, clients], accIdx) => {
          let bankTotal = 0;
          return (
            <View key={accIdx}>
              {Object.entries(clients).map(([clientName, rows], clientIdx) => {
                const sorted = [...rows].sort(
                  (a, b) => new Date(a.payment_date) - new Date(b.payment_date)
                );
                const subtotal = sorted.reduce((sum, r) => sum + Number(r.amount || 0), 0);
                bankTotal += subtotal;

                return (
                  <View key={`${accIdx}-${clientIdx}`}>
                    {sorted.map((item, i) => (
                      <View style={styles.row} key={`${accIdx}-${clientIdx}-${i}`}>
                        <Text style={[styles.cell, styles.date]}>
                          {formatDate(item.payment_date)}
                        </Text>
                        <Text style={[styles.cell, styles.client]}>{item.client_name}</Text>
                        <Text style={[styles.cell, styles.amount]}>
                          {Number(item.amount).toLocaleString()}
                        </Text>
                        <Text style={[styles.cell, styles.note]} wrap={false}>
                          {[item.description, item.note].filter(Boolean).join(' / ') || '―'}
                        </Text>
                      </View>
                    ))}
                    {sorted.length > 1 && (
                      <Text style={styles.subtotal}>
                        小計（{clientName} / {accountName}）: {subtotal.toLocaleString()} 円
                      </Text>
                    )}
                  </View>
                );
              })}
              <Text style={styles.bankTotal}>
                銀行合計（{accountName}）: {bankTotal.toLocaleString()} 円
              </Text>
            </View>
          );
        })}

        <Text style={styles.summary}>
          総件数: {list.length} 件　総合計金額: {total.toLocaleString()} 円
        </Text>
      </Page>
    </Document>
  );
};

export default WithdrawalsPagedDocument;
