import React from 'react';
import { ChefHat, Clock, Flame, CheckCircle2, TrendingUp, Award, Utensils } from 'lucide-react';

export default function ChefAnalyticsPage({ ordersList, getElapsedMins }) {
  const completedOrders = ordersList.filter(o => o.status === 'Served' || o.status === 'Completed' || o.status === 'Ready');
  const activeOrders = ordersList.filter(o => o.status === 'Placed' || o.status === 'Preparing');
  
  // Calculate real average prep time from completed orders
  const avgPrepTimeMins = completedOrders.length > 0
    ? Math.round(completedOrders.reduce((sum, o) => sum + getElapsedMins(o.createdAt), 0) / completedOrders.length)
    : 0;

  // Real Dynamic Category / Station Breakdown calculated from Database Order Items
  const stationAggregator = {};
  ordersList.forEach(ord => {
    if (Array.isArray(ord.items)) {
      ord.items.forEach(it => {
        const cat = it.category || 'Main Course';
        if (!stationAggregator[cat]) {
          stationAggregator[cat] = { station: cat, active: 0, completed: 0, totalQty: 0 };
        }
        const qty = Number(it.quantity || it.qty || 1);
        if (ord.status === 'Placed' || ord.status === 'Preparing') {
          stationAggregator[cat].active += qty;
        } else if (ord.status === 'Served' || ord.status === 'Completed' || ord.status === 'Ready') {
          stationAggregator[cat].completed += qty;
        }
        stationAggregator[cat].totalQty += qty;
      });
    }
  });

  const stationStats = Object.values(stationAggregator);

  return (
    <div className="admin-subpage-container" style={{ paddingBottom: '3rem' }}>
      
      {/* Header */}
      <div className="admin-dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div className="page-breadcrumb-bar">
          <span>Kitchen Pass</span>
          <span className="crumb-sep">›</span>
          <span className="crumb-current">Database Kitchen Performance Analytics</span>
        </div>
        <h1 className="admin-page-title">Database Kitchen Efficiency & Prep Velocity</h1>
        <p className="admin-page-subtitle">Real-time breakdown of ticket prep speeds, station load, and dish dispatch velocity derived directly from database orders.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="analytics-kpi-card" style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #F0EAE1', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B' }}>AVG KITCHEN PREP SPEED</span>
            <div style={{ backgroundColor: '#DCFCE7', padding: '0.5rem', borderRadius: '10px' }}>
              <Clock size={20} color="#166534" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F2A1D', marginTop: '0.3rem' }}>
            {avgPrepTimeMins} Mins
          </div>
          <div style={{ fontSize: '0.76rem', color: '#166534', fontWeight: 700, marginTop: '0.2rem' }}>
            Audited Live Preparation Velocity
          </div>
        </div>

        <div className="analytics-kpi-card" style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #F0EAE1', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B' }}>ACTIVE KITCHEN LOAD</span>
            <div style={{ backgroundColor: '#FFF3EB', padding: '0.5rem', borderRadius: '10px' }}>
              <Flame size={20} color="#E07A3C" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#E07A3C', marginTop: '0.3rem' }}>
            {activeOrders.length} Tickets
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700, marginTop: '0.2rem' }}>
            {ordersList.filter(o => o.status === 'Preparing').length} Currently Cooking
          </div>
        </div>

        <div className="analytics-kpi-card" style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #F0EAE1', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B' }}>DISPATCHED TODAY</span>
            <div style={{ backgroundColor: '#E0F2FE', padding: '0.5rem', borderRadius: '10px' }}>
              <CheckCircle2 size={20} color="#0284C7" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0284C7', marginTop: '0.3rem' }}>
            {completedOrders.length} Served
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700, marginTop: '0.2rem' }}>
            Audited Shift Tickets
          </div>
        </div>
      </div>

      {/* Real Station Load Breakdown */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.35rem 1.5rem', border: '1px solid #F0EAE1', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
          Real Kitchen Station Workload & Performance (Database)
        </h3>

        {stationStats.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8' }}>
            <Utensils size={36} color="#CBD5E1" style={{ display: 'block', margin: '0 auto 0.5rem auto' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#475569' }}>No station items recorded in database yet</div>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>Scan customer table QR codes to send live orders to kitchen stations.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stationStats.map((st, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2A1D' }}>{st.station} Station</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{st.completed} Dispatched Dishes • {st.totalQty} Total Items</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#E07A3C' }}>{st.active} Active Cooking</div>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#DCFCE7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                    Live Station
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
