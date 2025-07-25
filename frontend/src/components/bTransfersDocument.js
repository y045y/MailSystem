import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'NotoSansJP',
  src: '/fonts/NotoSansJP-Regular.ttf',
  fontStyle: 'normal',
});

const formatDate = (iso) => {
  if (!iso || typeof iso !== 'string') return '---';
  const date = new Date(iso);
  return isNaN(date.getTime()) ? '---' : `${date.getMonth() + 1}/${date.getDate()}`;
};

const formatMonthLabel = (monthStr) => {
  if (!monthStr) return '';
  const [, m] = monthStr.split('-');
  return `${parseInt(m, 10)}月分`;
};

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'NotoSansJP' },
  title: { fontSize: 16, marginBottom: 15, textAlign: 'center' },
  table: {
    display: 'table',
    width: '100%',
    borderLeft: 1,
    borderTop: 0,
  },
  row: { flexDirection: 'row' },
  header: { backgroundColor: '#f0f0f0', fontWeight: 'bold' },
  cell: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 4,
  },
  cellReceived: { width: '8%' },
  cellDate: { width: '8%' },
  cellClient: { width: '25%' },
  cellAmount: { width: '12%', textAlign: 'right' },
  cellAccount: { width: '42%' },
  cellStatus: { width: '5%', textAlign: 'center' },
  summary: { marginTop: 20, textAlign: 'right', fontSize: 11 },
});

const groupByKey = (array, keyFn) => {
  return array.reduce((result, item) => {
    const key = keyFn(item);
    if (!result[key]) result[key] = [];
    result[key].push(item);
    return result;
  }, {});
};

const TransfersDocument = ({ transfers = [], month }) => {
  const safeTransfers = Array.isArray(transfers)
    ? transfers.filter(
        (item) =>
          item &&
          typeof item.payment_date === 'string' &&
          !isNaN(new Date(item.payment_date).getTime()) &&
          typeof item.amount !== 'undefined'
      )
    : [];

  const total = safeTransfers.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const monthLabel = formatMonthLabel(month);

  const groupedTransfers = groupByKey(safeTransfers, (item) => {
    const client = item.client_name || '―';
    const account =
      item.bank_account_name || `${item.bank_name || ''}（${item.bank_account || '―'}）`;
    return `${client}__${account}`;
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>振込一覧帳票（{monthLabel}）</Text>

        {/* ✅ 固定ヘッダー */}
        <View fixed>
          <View
            style={[
              styles.row,
              styles.header,
              {
                borderTopWidth: 1,
                borderLeftWidth: 1,
                borderRightWidth: 0,
              },
            ]}
          >
            <Text style={[styles.cell, styles.cellReceived]}>受取日</Text>
            <Text style={[styles.cell, styles.cellDate]}>支払日</Text>
            <Text style={[styles.cell, styles.cellClient]}>取引先</Text>
            <Text style={[styles.cell, styles.cellAmount]}>金額</Text>
            <Text style={[styles.cell, styles.cellAccount]}>口座</Text>
            <Text style={[styles.cell, styles.cellStatus]}>済</Text>
          </View>
          <View
            style={[
              styles.row,
              styles.header,
              {
                borderLeftWidth: 1,
                borderRightWidth: 0,
                borderBottomWidth: 0,
              },
            ]}
          >
            <Text style={[styles.cell, { width: '100%' }]}>備考</Text>
          </View>
        </View>

        {/* ✅ 明細テーブル */}
        <View style={styles.table}>
          {Object.entries(groupedTransfers).map(([groupKey, items], idx) => {
            const groupTotal = items.reduce((sum, t) => sum + Number(t.amount || 0), 0);
            const [clientName, accountName] = groupKey.split('__');

            return (
              <React.Fragment key={idx}>
                {items.map((item, subIdx) => (
                  <View key={`${idx}-${subIdx}`} wrap>
                    <View style={styles.row}>
                      <Text style={[styles.cell, styles.cellReceived]}>
                        {formatDate(item.received_at)}
                      </Text>
                      <Text style={[styles.cell, styles.cellDate]}>
                        {formatDate(item.payment_date)}
                      </Text>
                      <Text style={[styles.cell, styles.cellClient]}>
                        {item.client_name || '―'}
                      </Text>
                      <Text style={[styles.cell, styles.cellAmount]}>
                        {Number(item.amount).toLocaleString()}
                      </Text>
                      <Text style={[styles.cell, styles.cellAccount]}>
                        {item.bank_account_name
                          ? item.bank_account_name
                          : item.bank_name && item.bank_account
                          ? `${item.bank_name}（${item.bank_account}）`
                          : '―'}
                      </Text>
                      <Text style={[styles.cell, styles.cellStatus]}>
                        {item.status === '振込済み' ? '✓' : ''}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text
                        style={[
                          styles.cell,
                          { width: '100%', borderLeftWidth: 0, borderTopWidth: 0, paddingLeft: 8 },
                        ]}
                      >
                        {[item.description, item.note].filter(Boolean).join(' / ') || '―'}
                      </Text>
                    </View>
                  </View>
                ))}

                {items.length > 1 && (
                  <View style={[styles.row, { backgroundColor: '#eaeaea' }]}>
                    <Text
                      style={[styles.cell, { width: '100%', textAlign: 'right', paddingRight: 8 }]}
                    >
                      小計（{clientName} / {accountName}）: {groupTotal.toLocaleString()} 円
                    </Text>
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </View>

        <Text style={styles.summary}>{`${
          safeTransfers.length
        } 件 合計: ${total.toLocaleString()} 円`}</Text>
      </Page>
    </Document>
  );
};

export default TransfersDocument;
