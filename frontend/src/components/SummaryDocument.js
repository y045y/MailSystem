import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'NotoSansJP',
  src: '/fonts/NotoSansJP-Regular.ttf',
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
  sectionTitle: {
    fontSize: 12,
    marginVertical: 8,
    fontWeight: 'bold',
    pageBreakBefore: 'always',
  },
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 12,
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
  cellReceived: { width: '8%' },
  cellPayment: { width: '8%' },
  cellClient: { width: '25%' },
  cellAmount: { width: '12%', textAlign: 'right' },
  cellAccount: { width: '42%' },
  cellStatus: { width: '5%', textAlign: 'center' },
  summary: {
    marginBottom: 20,
    textAlign: 'right',
    fontSize: 11,
  },
});

const Table = ({ data }) => (
  <View style={styles.table} wrap>
    {/* ヘッダー：1行目 */}
    <View style={[styles.row, styles.header]} fixed>
      <Text style={[styles.cell, styles.cellReceived]}>受取日</Text>
      <Text style={[styles.cell, styles.cellPayment]}>支払日</Text>
      <Text style={[styles.cell, styles.cellClient]}>取引先</Text>
      <Text style={[styles.cell, styles.cellAmount]}>金額</Text>
      <Text style={[styles.cell, styles.cellAccount]}>口座</Text>
      <Text style={[styles.cell, styles.cellStatus]}>済</Text>
    </View>
    {/* ヘッダー：2行目 備考 */}
    <View style={[styles.row, styles.header]} fixed>
      <Text style={[styles.cell, { width: '100%' }]}>備考</Text>
    </View>

    {data.length === 0 ? (
      <>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.cellReceived]}>---</Text>
          <Text style={[styles.cell, styles.cellPayment]}>---</Text>
          <Text style={[styles.cell, styles.cellClient]}>データが存在しません</Text>
          <Text style={[styles.cell, styles.cellAmount]}>―</Text>
          <Text style={[styles.cell, styles.cellAccount]}>―</Text>
          <Text style={[styles.cell, styles.cellStatus]}>―</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, { width: '100%' }]}>―</Text>
        </View>
      </>
    ) : (
      data.map((item, idx) => (
        <View key={idx} wrap>
          {/* 1行目：基本 */}
          <View style={styles.row}>
            <Text style={[styles.cell, styles.cellReceived]}>{formatDate(item.received_at)}</Text>
            <Text style={[styles.cell, styles.cellPayment]}>{formatDate(item.payment_date)}</Text>
            <Text style={[styles.cell, styles.cellClient]}>{item.client_name || '―'}</Text>
            <Text style={[styles.cell, styles.cellAmount]}>
              {Number(item.amount || 0).toLocaleString()}
            </Text>
            <Text style={[styles.cell, styles.cellAccount]}>{item.bank_account_name || '―'}</Text>
            <Text style={[styles.cell, styles.cellStatus]}>
              {item.status === '振込済み' ? '✓' : ''}
            </Text>
          </View>
          {/* 2行目：備考 */}
          <View style={styles.row}>
            <Text
              style={[
                styles.cell,
                {
                  width: '100%',
                  borderLeftWidth: 0,
                  borderTopWidth: 0,
                  paddingLeft: 8,
                },
              ]}
            >
              {item.description || item.note
                ? [item.description, item.note].filter(Boolean).join(' / ')
                : '―'}
            </Text>
          </View>
        </View>
      ))
    )}
  </View>
);

const SummaryDocument = ({
  transfers = [],
  withdrawals = [],
  summary = {},
  balances = [],
  totalCash = {},
  month,
}) => {
  const monthLabel = formatMonthLabel(month);

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>振込・引落一覧（{monthLabel}）</Text>

        <Text style={styles.sectionTitle}>■ 振込一覧</Text>
        <Table data={transfers} />
        <Text style={styles.summary}>
          {transfers.length} 件　合計: {transfers.reduce((sum, t) => sum + Number(t.amount || 0), 0).toLocaleString()} 円
        </Text>

        <Text style={styles.sectionTitle}>■ 引落一覧</Text>
        <Table data={withdrawals} />
        <Text style={styles.summary}>
          {withdrawals.length} 件　合計: {withdrawals.reduce((sum, t) => sum + Number(t.amount || 0), 0).toLocaleString()} 円
        </Text>

        <Text style={styles.sectionTitle}>■ 総合計</Text>
        <Text style={styles.summary}>
          総件数: {summary.total_count ?? 0} 件　総合計金額: {Number(summary.total_amount ?? 0).toLocaleString()} 円
        </Text>

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
