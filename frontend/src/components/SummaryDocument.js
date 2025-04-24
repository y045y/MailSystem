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
    fontSize: 9.5,
    fontFamily: 'NotoSansJP',
  },
  title: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderBottomWidth: 0,
    marginBottom: 8,
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
    borderRightWidth: 1,
    padding: 3,
  },
  cellReceived: { width: '8%' },
  cellPayment: { width: '8%' },
  cellClient: { width: '25%' },
  cellAmount: { width: '12%', textAlign: 'right' },
  cellAccount: { width: '42%' },
  cellStatus: { width: '5%', textAlign: 'center' },
  summary: {
    marginTop: 12,
    textAlign: 'right',
    fontSize: 10,
    paddingTop: 5,
  },
  finalSummary: {
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },
});

const renderTablePages = (data, title, totalCount, totalAmount, monthLabel, isFirstPage) => {
  const itemsPerPage = 15;
  const pages = [];

  for (let i = 0; i < data.length; i += itemsPerPage) {
    const pageData = data.slice(i, i + itemsPerPage);
    const isLastPage = i + itemsPerPage >= data.length;
    const showSummary = isLastPage;

    pages.push(
      <Page size="A4" style={styles.page} key={`${title}-${i}`} wrap>
        {i === 0 && isFirstPage && (
          <Text style={styles.title}>振込・引落一覧（{monthLabel}）</Text>
        )}
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.table} wrap>
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, styles.cellReceived]}>受取日</Text>
            <Text style={[styles.cell, styles.cellPayment]}>支払日</Text>
            <Text style={[styles.cell, styles.cellClient]}>取引先</Text>
            <Text style={[styles.cell, styles.cellAmount]}>金額</Text>
            <Text style={[styles.cell, styles.cellAccount]}>口座</Text>
            <Text style={[styles.cell, styles.cellStatus]}>済</Text>
          </View>
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, { width: '100%' }]}>備考</Text>
          </View>

          {pageData.map((item, idx) => (
            <React.Fragment key={idx}>
              <View style={styles.row}>
                <Text style={[styles.cell, styles.cellReceived]}>{formatDate(item.received_at)}</Text>
                <Text style={[styles.cell, styles.cellPayment]}>{formatDate(item.payment_date)}</Text>
                <Text style={[styles.cell, styles.cellClient]}>{item.client_name || '―'}</Text>
                <Text style={[styles.cell, styles.cellAmount]}>{Number(item.amount || 0).toLocaleString()}</Text>
                <Text style={[styles.cell, styles.cellAccount]}>{item.bank_account_name || '―'}</Text>
                <Text style={[styles.cell, styles.cellStatus]}>{item.status === '振込済み' ? '✓' : ''}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.cell, { width: '100%', borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, paddingLeft: 6 }]}>{[item.description, item.note].filter(Boolean).join(' / ') || '―'}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
        {showSummary && (
          <Text style={styles.summary}>{`合計: ${totalCount} 件　${totalAmount.toLocaleString()} 円`}</Text>
        )}
      </Page>
    );
  }

  return pages;
};

const SummaryDocument = ({ transfers = [], withdrawals = [], summary = {}, balances = [], totalCash = {}, month }) => {
  const monthLabel = formatMonthLabel(month);
  const transferTotal = transfers.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const withdrawalTotal = withdrawals.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalCount = transfers.length + withdrawals.length;
  const totalAmount = transferTotal + withdrawalTotal;

  return (
    <Document>
      {renderTablePages(transfers, '■ 振込一覧', transfers.length, transferTotal, monthLabel, true)}
      {renderTablePages(withdrawals, '■ 引落一覧', withdrawals.length, withdrawalTotal, monthLabel, false)}
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.summary}>{`総件数: ${totalCount} 件　総合計金額: ${totalAmount.toLocaleString()} 円`}</Text>
        <Text style={styles.sectionTitle}>■ 流動口座残高</Text>
        <View style={styles.table} wrap>
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, { width: '60%' }]}>口座名</Text>
            <Text style={[styles.cell, { width: '20%', textAlign: 'right' }]}>残高</Text>
            <Text style={[styles.cell, { width: '20%' }]}>日付</Text>
          </View>
          {balances.map((b, i) => (
            <View key={i} style={styles.row} wrap>
              <Text style={[styles.cell, { width: '60%' }]}>{b.account_label}</Text>
              <Text style={[styles.cell, { width: '20%', textAlign: 'right' }]}>{Number(b.balance).toLocaleString()} 円</Text>
              <Text style={[styles.cell, { width: '20%' }]}>{formatDate(b.date)}</Text>
            </View>
          ))}
          <View style={styles.row} wrap>
            <Text style={[styles.cell, { width: '60%', fontWeight: 'bold' }]}>総流動残高</Text>
            <Text style={[styles.cell, { width: '20%', textAlign: 'right', fontWeight: 'bold' }]}>{Number(totalCash.total_cash_balance || 0).toLocaleString()} 円</Text>
            <Text style={[styles.cell, { width: '20%' }]}></Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default SummaryDocument;
