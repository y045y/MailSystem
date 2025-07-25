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

const groupNested = (array) => {
  const result = {};
  for (const item of array) {
    const account =
      item.bank_account_name || `${item.bank_name || ''}（${item.bank_account || '―'}）`;
    const client = item.client_name || '―';
    if (!result[account]) result[account] = {};
    if (!result[account][client]) result[account][client] = [];
    result[account][client].push(item);
  }
  return result;
};

const WithdrawalsDocument = ({ withdrawals = [], month }) => {
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
  const grouped = groupNested(safeWithdrawals);

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>引落一覧帳票（{monthLabel}）</Text>

        <View fixed>
          <View
            style={[
              styles.row,
              styles.header,
              {
                borderWidth: 1,
                borderBottomWidth: 0,
              },
            ]}
          >
            <Text style={[styles.cell, styles.cellDate]}>引落日</Text>
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
                borderRightWidth: 1,
                borderTopWidth: 0,
                borderBottomWidth: 1,
              },
            ]}
          >
            <Text
              style={{
                padding: 4,
                width: '100%',
                borderLeftWidth: 0,
                borderRightWidth: 0,
                borderTopWidth: 0,
                borderBottomWidth: 0,
              }}
            >
              備考
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          {Object.entries(grouped).map(([accountName, clients], accIdx) => {
            let bankTotal = 0;

            return (
              <View key={accIdx} wrap>
                {Object.entries(clients).map(([clientName, items], clIdx) => {
                  const sortedItems = items.sort(
                    (a, b) => new Date(a.payment_date) - new Date(b.payment_date)
                  );
                  const groupTotal = sortedItems.reduce((sum, t) => sum + Number(t.amount || 0), 0);
                  bankTotal += groupTotal;

                  return (
                    // <View key={clIdx} wrap={false}>
                    <View key={clIdx}>
                      {sortedItems.map((item, index) => (
                        <React.Fragment key={index}>
                          <View style={styles.row}>
                            <Text style={[styles.cell, styles.cellDate]}>
                              {formatDate(item.payment_date)}
                            </Text>
                            <Text style={[styles.cell, styles.cellClient]}>
                              {item.client_name || '―'}
                            </Text>
                            <Text style={[styles.cell, styles.cellAmount]}>
                              {Number(item.amount).toLocaleString()}
                            </Text>
                            <Text style={[styles.cell, styles.cellAccount]}>{accountName}</Text>
                            <Text style={[styles.cell, styles.cellStatus]}>
                              {item.status === '振込済み' ? '✓' : ''}
                            </Text>
                          </View>
                          <View style={styles.row}>
                            <Text
                              style={{
                                borderStyle: 'solid',
                                borderTopWidth: 0,
                                borderRightWidth: 0,
                                borderBottomWidth: 1,
                                borderLeftWidth: 0,
                                padding: 4,
                                paddingLeft: 8,
                                width: '100%',
                                fontSize: 9,
                              }}
                            >
                              {[item.description, item.note].filter(Boolean).join(' / ') || '―'}
                            </Text>
                          </View>
                        </React.Fragment>
                      ))}

                      {sortedItems.length > 1 && (
                        <View style={[styles.row, { backgroundColor: '#eaeaea' }]}>
                          <Text
                            style={[
                              styles.cell,
                              {
                                width: '100%',
                                textAlign: 'right',
                                paddingRight: 8,
                                borderLeftWidth: 1,
                              },
                            ]}
                          >
                            小計（{clientName} / {accountName}）: {groupTotal.toLocaleString()} 円
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}

                <View style={[styles.row, { backgroundColor: '#dfefff' }]}>
                  <Text
                    style={[
                      styles.cell,
                      {
                        width: '100%',
                        textAlign: 'right',
                        paddingRight: 8,
                        borderLeftWidth: 1,
                      },
                    ]}
                  >
                    銀行合計（{accountName}）: {bankTotal.toLocaleString()} 円
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.summary}>{`総件数: ${
          safeWithdrawals.length
        } 件　総合計金額: ${total.toLocaleString()} 円`}</Text>
      </Page>
    </Document>
  );
};

export default WithdrawalsDocument;
