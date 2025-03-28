import './App.css';
import React, { useState, useEffect } from 'react';
import MailForm from './components/MailForm';
import MailListTransfers from './components/MailListTransfers';
import MailListWithdrawals from './components/MailListWithdrawals';
import MailListNotices from './components/MailListNotices';
import MailListOthers from './components/MailListOthers';
import ClientMaster from './components/ClientMaster'; // ← 取引先マスタ
import CompanyMaster from './components/CompanyMaster'; // ← 自社マスタ

const App = () => {
  const [selectedTab, setSelectedTab] = useState('mail'); // 'mail' | 'client' | 'company'

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (`0${today.getMonth() + 1}`).slice(-2);
    return `${year}-${month}`;
  });

  const [reloadKey, setReloadKey] = useState(0);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [receivedStartDate, setReceivedStartDate] = useState('');
  const [receivedEndDate, setReceivedEndDate] = useState('');

  // 月切り替えで支払日・受取日両方更新
  const setMonthAndDates = (year, month) => {
    const paddedMonth = (`0${month}`).slice(-2);
    const monthStr = `${year}-${paddedMonth}`;
    setSelectedMonth(monthStr);

    const firstDay = `${monthStr}-01`;
    const lastDateObj = new Date(year, month, 0);
    const lastDay = `${lastDateObj.getFullYear()}-${(`0${lastDateObj.getMonth() + 1}`).slice(-2)}-${(`0${lastDateObj.getDate()}`).slice(-2)}`;

    setStartDate(firstDay);
    setEndDate(lastDay);
    setReceivedStartDate(firstDay);
    setReceivedEndDate(lastDay);
  };

  useEffect(() => {
    const today = new Date();
    setMonthAndDates(today.getFullYear(), today.getMonth() + 1);
  }, []);

  const handleNextMonth = () => {
    const date = new Date(selectedMonth + '-01');
    date.setMonth(date.getMonth() + 1);
    setMonthAndDates(date.getFullYear(), date.getMonth() + 1);
  };

  const handlePrevMonth = () => {
    const date = new Date(selectedMonth + '-01');
    date.setMonth(date.getMonth() - 1);
    setMonthAndDates(date.getFullYear(), date.getMonth() + 1);
  };

  const handleThisMonth = () => {
    const today = new Date();
    setMonthAndDates(today.getFullYear(), today.getMonth() + 1);
  };

  return (
    <div className="App">
      <h1>郵便物管理システム</h1>

      {/* タブ切り替え */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setSelectedTab('mail')}>郵便物</button>
        <button onClick={() => setSelectedTab('client')}>取引先マスタ</button>
        <button onClick={() => setSelectedTab('company')}>自社マスタ</button>
      </div>

      {selectedTab === 'mail' ? (
        <>
          {/* 登録フォーム */}
          <MailForm onSubmitted={() => setReloadKey(prev => prev + 1)} />

          <hr />

          {/* 月切り替え */}
          <div>
            <label>表示する月: {selectedMonth}</label>
            <div style={{ marginTop: '10px' }}>
              <button onClick={handlePrevMonth}>前月</button>
              <button onClick={handleThisMonth}>当月</button>
              <button onClick={handleNextMonth}>次月</button>
            </div>
          </div>

          {/* 支払日（振込・引落） */}
          <div style={{ marginBottom: '30px' }}>
            <label>支払日（開始）:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ marginRight: '20px' }}
            />
            <label>支払日（終了）:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* 一覧 */}
          <MailListTransfers
            month={selectedMonth}
            startDate={startDate}
            endDate={endDate}
            reloadKey={reloadKey}
          />
          <MailListWithdrawals
            month={selectedMonth}
            startDate={startDate}
            endDate={endDate}
            reloadKey={reloadKey}
          />
          <MailListNotices
            month={selectedMonth}
            startDate={receivedStartDate}
            endDate={receivedEndDate}
            reloadKey={reloadKey}
          />
          <MailListOthers
            month={selectedMonth}
            startDate={receivedStartDate}
            endDate={receivedEndDate}
            reloadKey={reloadKey}
          />
        </>
      ) : selectedTab === 'client' ? (
        <ClientMaster />
      ) : (
        <CompanyMaster />
      )}
    </div>
  );
};

export default App;
