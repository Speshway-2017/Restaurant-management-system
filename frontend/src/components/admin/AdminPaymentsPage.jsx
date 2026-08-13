import React from 'react';
import { Receipt, CheckCircle2, DollarSign, Download, ArrowUpRight } from 'lucide-react';

export default function AdminPaymentsPage() {
  const transactions = [
    { id: 'TXN-90812', orderId: 'ORD-8944', method: 'UPI (PhonePe)', amount: '₹760', status: 'Settled', time: '11:42 AM', ref: 'PAY_1908234' },
    { id: 'TXN-90811', orderId: 'ORD-8942', method: 'Card (HDFC POS)', amount: '₹980', status: 'Settled', time: '11:30 AM', ref: 'PAY_1908230' },
    { id: 'TXN-90810', orderId: 'ORD-8941', method: 'UPI (Google Pay)', amount: '₹1,240', status: 'Settled', time: '11:22 AM', ref: 'PAY_1908225' },
    { id: 'TXN-90809', orderId: 'ORD-8940', method: 'Cash Counter', amount: '₹1,850', status: 'In Drawer', time: '11:10 AM', ref: 'CASH_REG_01' },
  ];

  return (
    <div className="admin-subpage-container">
      <div className="admin-dashboard-header">
        <div>
          <div className="page-breadcrumb-bar">
            <span>Admin</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Payments & Settlements</span>
          </div>
          <h1 className="admin-page-title">Payments & Settlements</h1>
          <p className="admin-page-subtitle">Daily payment collections, UPI payouts, and cash drawer reconciliations.</p>
        </div>
        <button className="btn btn-primary">
          <Download size={16} />
          <span>Export Settlement Report</span>
        </button>
      </div>

      <div className="admin-grid-12 mb-4">
        <div className="admin-card col-span-4">
          <div className="text-xs text-muted font-bold">UPI ONLINE PAYMENTS</div>
          <div className="text-2xl font-bold mt-1" style={{ color: '#1E4636' }}>₹52,480</div>
          <div className="text-xs text-muted mt-1">Pine Labs & PhonePe PG</div>
        </div>
        <div className="admin-card col-span-4">
          <div className="text-xs text-muted font-bold">CARD POS TERMINAL</div>
          <div className="text-2xl font-bold mt-1" style={{ color: '#E07A3C' }}>₹22,140</div>
          <div className="text-xs text-muted mt-1">Pine Labs Android POS</div>
        </div>
        <div className="admin-card col-span-4">
          <div className="text-xs text-muted font-bold">CASH DRAWER TOTAL</div>
          <div className="text-2xl font-bold mt-1" style={{ color: '#2B2B2B' }}>₹9,940</div>
          <div className="text-xs text-muted mt-1">Counter Cash Box 01</div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Order Ref</th>
                <th>Payment Mode</th>
                <th>Amount</th>
                <th>Gateway Ref</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="font-semibold" style={{ color: '#1E4636' }}>{t.id}</td>
                  <td>{t.orderId}</td>
                  <td>{t.method}</td>
                  <td className="font-semibold">{t.amount}</td>
                  <td className="text-xs text-muted">{t.ref}</td>
                  <td className="text-xs text-muted">{t.time}</td>
                  <td><span className="status-badge-unified is-ready">{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
