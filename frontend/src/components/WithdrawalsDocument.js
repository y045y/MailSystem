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
  cellDate: { width: '8%' },
  cellClient: { width: '25%' },
  cellAmount: { width: '12%', textAlign: 'right' },
  cellAccount: { width: '50%' },
  cellStatus: { width: '5%', textAlign: 'center' },
  summary: {
    marginTop: 20,
    textAlign: 'right',
    fontSize: 11,
  },
});

const WithdrawalsDocument = ({ withdrawals = [], month }) => {
  const itemsPerPage = 13;
  const safeWithdrawals = Array.isArray(withdrawals)
    ? withdrawals.filter(
        (item) =>
          item &&
          typeof item.payment_date === 'string' &&
          !isNaN(new Date(item.payment_date).getTime()) &&
          typeof item.amount !== 'undefined'
      )
    : [];

  const total = safeWithdrawals.reduce((sum, t) => {
    const amt = Number(t.amount || 0);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  const monthLabel = formatMonthLabel(month);

  return (
    <Document>
      {Array.from({ length: Math.ceil(safeWithdrawals.length / itemsPerPage) }).map((_, pageIndex) => {
        const start = pageIndex * itemsPerPage;
        const pageData = safeWithdrawals.slice(start, start + itemsPerPage);
        
        return (
          <Page key={pageIndex} size="A4" style={styles.page} wrap>
            <Text style={styles.title}>引落一覧帳票（{monthLabel}）</Text>
            <View style={styles.table}>
              <View style={[styles.row, styles.header]}>
                <Text style={[styles.cell, styles.cellDate]}>引落日</Text>
                <Text style={[styles.cell, styles.cellClient]}>取引先</Text>
                <Text style={[styles.cell, styles.cellAmount]}>金額</Text>
                <Text style={[styles.cell, styles.cellAccount]}>口座</Text>
                <Text style={[styles.cell, styles.cellStatus]}>済</Text>
              </View>
              <View style={[styles.row, styles.header]}>
                <Text style={[styles.cell, { width: '100%' }]}>備考</Text>
              </View>
              {pageData.length === 0 ? (
                <>
                  <View style={styles.row}>
                    <Text style={[styles.cell, styles.cellDate]}>---</Text>
                    <Text style={[styles.cell, styles.cellClient]}>データが存在しません</Text>
                    <Text style={[styles.cell, styles.cellAmount]}></Text>
                    <Text style={[styles.cell, styles.cellAccount]}></Text>
                    <Text style={[styles.cell, styles.cellStatus]}></Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={[styles.cell, { width: '100%' }]}>―</Text>
                  </View>
                </>
              ) : (
                pageData.map((item, idx) => (
                  <View key={idx} wrap>
                    <View style={styles.row}>
                      <Text style={[styles.cell, styles.cellDate]}>{formatDate(item.payment_date)}</Text>
                      <Text style={[styles.cell, styles.cellClient]}>{item.client_name || '―'}</Text>
                      <Text style={[styles.cell, styles.cellAmount]}>{Number(item.amount).toLocaleString()}</Text>
                      <Text style={[styles.cell, styles.cellAccount]}>{item.bank_account_name || (item.bank_name && item.bank_account ? `${item.bank_name}（${item.bank_account}）` : '―')}</Text>
                      <Text style={[styles.cell, styles.cellStatus]}>{item.status === '振込済み' ? '✓' : ''}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={[styles.cell, { width: '100%', borderLeftWidth: 0, borderTopWidth: 0, paddingLeft: 8 }]}>{[item.description, item.note].filter(Boolean).join(' / ') || '―'}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
            <Text style={styles.summary}>{`総件数: ${safeWithdrawals.length} 件　総合計金額: ${total.toLocaleString()} 円`}</Text>
          </Page>
        );
      })}
      
</Document>
  );
};

export default WithdrawalsDocument;
