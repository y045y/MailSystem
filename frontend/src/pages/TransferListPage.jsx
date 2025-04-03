import React, { useEffect, useState } from "react";
import axios from "axios";

const TransferListPage = () => {
  const [transferList, setTransferList] = useState([]);
  const targetMonth = "2025-04";

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/transfer-list/${targetMonth}`)
      .then((res) => setTransferList(res.data))
      .catch((err) => console.error("取得失敗:", err));
  }, []);

  return (
    <div>
      <h2>振込一覧（{targetMonth}）</h2>
      <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>支払日</th>
            <th>取引先</th>
            <th>金額</th>
            <th>口座名義</th>
            <th>備考</th>
          </tr>
        </thead>
        <tbody>
          {transferList.map((item) => (
            <tr key={item.mail_id}>
              <td>{item.payment_date}</td>
              <td>{item.client_name}</td>
              <td>{Number(item.amount).toLocaleString()} 円</td>
              <td>{item.bank_account_name}</td>
              <td>{item.description} {item.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransferListPage;
