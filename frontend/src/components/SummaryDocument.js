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
  cellClient: { width: '18%' },
  cellAmount: { width: '8%', textAlign: 'right' },
  cellAccount: { width: '41%' },
  cellNote: { width: '25%' },
  summary: {
    marginTop: 12,
    textAlign: 'right',
    fontSize: 11,
  },
});

const Table = ({ data }) => (
  <View style={styles.table}>
    <View style={[styles.row, styles.header]}>
      <Text style={[styles.cell, styles.cellDate]}>支払日</Text>
      <Text style={[styles.cell, styles.cellClient]}>取引先</Text>
      <Text style={[styles.cell, styles.cellAmount]}>金額</Text>
      <Text style={[styles.cell, styles.cellAccount]}>口座</Text>
      <Text style={[styles.cell, styles.cellNote]}>備考</Text>
    </View>
    {data.length === 0 ? (
      <View style={styles.row}>
        <Text style={[styles.cell, styles.cellDate]}>---</Text>
        <Text style={[styles.cell, styles.cellClient]}>データが存在しません</Text>
        <Text style={[styles.cell, styles.cellAmount]}>―</Text>
        <Text style={[styles.cell, styles.cellAccount]}>―</Text>
        <Text style={[styles.cell, styles.cellNote]}>―</Text>
      </View>
    ) : (
      data.map((item, idx) => (
        <View style={styles.row} key={idx} wrap={false}>
          <Text style={[styles.cell, styles.cellDate]}>
            {formatDate(item.payment_date)}
          </Text>
          <Text style={[styles.cell, styles.cellClient]}>
            {item.client_name || '―'}
          </Text>
          <Text style={[styles.cell, styles.cellAmount]}>
            {Number(item.amount || 0).toLocaleString()}
          </Text>
          <Text style={[styles.cell, styles.cellAccount]}>
            {item.bank_account_name || '―'}
          </Text>
          <Text style={[styles.cell, styles.cellNote]}>
            {item.description || item.note
              ? [item.description, item.note].filter(Boolean).join(' / ')
              : '―'}
          </Text>
        </View>
      ))
    )}
  </View>
);

const SummaryDocument = ({ transfers = [], withdrawals = [], summary = {}, month }) => {
  const monthLabel = formatMonthLabel(month);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
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
      </Page>
    </Document>
  );
};

export default SummaryDocument;
