// 分割改ページ対応 SummaryDocument（15件＝30行ごと + 小計 + 流動口座）
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
  sectionTitle: { fontSize: 12, marginBottom: 6, fontWeight: 'bold' },
  table: { display: 'table', width: '100%', marginBottom: 8 },
  row: { flexDirection: 'row' },
  header: { backgroundColor: '#f0f0f0', fontWeight: 'bold', borderTopWidth: 1 },
  cell: {
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 0,
    padding: 4,
  },
  cellLast: { borderRightWidth: 1 },
  noteLine: {
    width: '100%',
    fontSize: 10,
    paddingLeft: 8,
    paddingTop: 2,
    paddingBottom: 2,
    borderStyle: 'solid',
    borderWidth: 1,
    borderTopWidth: 0,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  subtotalLine: {
    width: '100%',
    textAlign: 'right',
    paddingRight: 8,
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#eaeaea',
    borderStyle: 'solid',
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  summary: { textAlign: 'right', fontSize: 10, marginTop: 10 },
});

const groupByKey = (array, keyFn) => {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
};

const SummaryDocument = ({
  transfers = [],
  withdrawals = [],
  balances = [],
  totalCash = 0,
  month,
}) => {
  const monthLabel = formatMonthLabel(month);
  const groupedTransfers = groupByKey(transfers, (item) => item.client_name || '―');
  const groupedWithdrawals = groupByKey(
    withdrawals,
    (item) => item.bank_account_name || `${item.bank_name}（${item.bank_account}）`
  );
  const totalTransfer = transfers.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalWithdrawal = withdrawals.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // ✅ 修正後（正しく表示される）
  const computedBalances = balances.map((c) => ({
    account_name: c.account_name,
    balance: c.balance,
  }));

  const totalCount = transfers.length + withdrawals.length;
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>振込・引落一覧帳票（{monthLabel}）</Text>

        {/* 振込一覧（取引先ごと） */}
        <Text style={styles.sectionTitle}>■ 振込一覧（取引先ごと）</Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, { width: '8%' }]}>支払日</Text>
            <Text style={[styles.cell, { width: '25%' }]}>取引先</Text>
            <Text style={[styles.cell, { width: '12%', textAlign: 'right' }]}>金額</Text>
            <Text style={[styles.cell, { width: '50%' }]}>口座</Text>
            <Text style={[styles.cell, styles.cellLast, { width: '5%', textAlign: 'center' }]}>
              済
            </Text>
          </View>
          {Object.entries(groupedTransfers).map(([client, items], idx) => {
            const subtotal = items.reduce((sum, i) => sum + Number(i.amount || 0), 0);
            return (
              <React.Fragment key={idx}>
                {items.map((item, i) => (
                  <React.Fragment key={i}>
                    <View style={styles.row}>
                      <Text style={[styles.cell, { width: '8%' }]}>
                        {formatDate(item.payment_date)}
                      </Text>
                      <Text style={[styles.cell, { width: '25%' }]}>{item.client_name}</Text>
                      <Text style={[styles.cell, { width: '12%', textAlign: 'right' }]}>
                        {Number(item.amount).toLocaleString()}
                      </Text>
                      <Text style={[styles.cell, { width: '50%' }]}>
                        {item.bank_account_name || '―'}
                      </Text>
                      <Text
                        style={[styles.cell, styles.cellLast, { width: '5%', textAlign: 'center' }]}
                      >
                        {item.status === '振込済み' ? '✓' : ''}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.noteLine}>
                        {[item.description, item.note].filter(Boolean).join(' / ') || '―'}
                      </Text>
                    </View>
                  </React.Fragment>
                ))}
                {items.length > 1 && (
                  <View style={styles.row}>
                    <Text style={styles.subtotalLine}>
                      小計（{client}）: {subtotal.toLocaleString()} 円（{items.length} 件）
                    </Text>
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </View>
        <Text style={styles.summary}>
          振込合計: {totalTransfer.toLocaleString()} 円（{transfers.length} 件）
        </Text>

        {/* 引落一覧（銀行口座 → 取引先ごと） */}
        <Text style={styles.sectionTitle}>■ 引落一覧（銀行口座ごとの合計）</Text>
        {Object.entries(groupedWithdrawals).map(([accountLabel, items], idx) => {
          const groupedByClient = groupByKey(items, (item) => item.client_name || '―');
          let bankSubtotal = 0;
          return (
            <View key={idx} wrap>
              <Text style={[styles.sectionTitle, { marginTop: 10 }]}>{accountLabel}</Text>
              <View style={styles.table}>
                <View style={[styles.row, styles.header]}>
                  <Text style={[styles.cell, { width: '8%' }]}>引落日</Text>
                  <Text style={[styles.cell, { width: '25%' }]}>取引先</Text>
                  <Text style={[styles.cell, { width: '12%', textAlign: 'right' }]}>金額</Text>
                  <Text style={[styles.cell, { width: '50%' }]}>口座</Text>
                  <Text
                    style={[styles.cell, styles.cellLast, { width: '5%', textAlign: 'center' }]}
                  >
                    済
                  </Text>
                </View>
                {Object.entries(groupedByClient).map(([clientName, rows], ci) => {
                  const subtotal = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
                  bankSubtotal += subtotal;
                  return (
                    <React.Fragment key={ci}>
                      {rows.map((item, i) => (
                        <React.Fragment key={i}>
                          <View style={styles.row}>
                            <Text style={[styles.cell, { width: '8%' }]}>
                              {formatDate(item.payment_date)}
                            </Text>
                            <Text style={[styles.cell, { width: '25%' }]}>{item.client_name}</Text>
                            <Text style={[styles.cell, { width: '12%', textAlign: 'right' }]}>
                              {Number(item.amount).toLocaleString()}
                            </Text>
                            <Text style={[styles.cell, { width: '50%' }]}>{accountLabel}</Text>
                            <Text
                              style={[
                                styles.cell,
                                styles.cellLast,
                                { width: '5%', textAlign: 'center' },
                              ]}
                            >
                              {item.status === '振込済み' ? '✓' : ''}
                            </Text>
                          </View>
                          <View style={styles.row}>
                            <Text style={styles.noteLine}>
                              {[item.description, item.note].filter(Boolean).join(' / ') || '―'}
                            </Text>
                          </View>
                        </React.Fragment>
                      ))}
                      {rows.length > 1 && (
                        <View style={styles.row}>
                          <Text style={styles.subtotalLine}>
                            小計（{clientName}）: {subtotal.toLocaleString()} 円（{rows.length} 件）
                          </Text>
                        </View>
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
              <Text style={[styles.summary, { fontWeight: 'bold' }]}>
                口座小計（{accountLabel}）: {bankSubtotal.toLocaleString()} 円（{items.length} 件）
              </Text>
            </View>
          );
        })}

        <Text style={styles.summary}>
          引落合計: {totalWithdrawal.toLocaleString()} 円（{withdrawals.length} 件）
        </Text>

        {/* 合計欄を流動口座の上に移動 */}
        <Text style={styles.sectionTitle}>■ 振込・引落 合計</Text>
        <Text style={styles.summary}>
          振込合計: {totalTransfer.toLocaleString()} 円（{transfers.length} 件）
        </Text>
        <Text style={styles.summary}>
          引落合計: {totalWithdrawal.toLocaleString()} 円（{withdrawals.length} 件）
        </Text>
        <Text style={styles.summary}>
          総合計金額: {(totalTransfer + totalWithdrawal).toLocaleString()} 円（{totalCount} 件）
        </Text>

        {/* 流動口座残高 */}
        <Text style={styles.sectionTitle}>■ 流動口座残高</Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, { width: '70%' }]}>口座名</Text>
            <Text style={[styles.cell, styles.cellLast, { width: '30%', textAlign: 'right' }]}>
              残高
            </Text>
          </View>
          {computedBalances.map((c, i) => (
            <View key={i} style={styles.row}>
              <Text style={[styles.cell, { width: '70%' }]}>{c.account_name}</Text>
              <Text style={[styles.cell, styles.cellLast, { width: '30%', textAlign: 'right' }]}>
                {Number(c.balance).toLocaleString()} 円
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.summary}>流動口座合計: {Number(totalCash).toLocaleString()} 円</Text>
      </Page>
    </Document>
  );
};

export default SummaryDocument;
