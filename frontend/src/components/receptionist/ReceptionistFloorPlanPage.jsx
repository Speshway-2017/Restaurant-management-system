import React, { useState, useEffect, useMemo } from 'react';
import {
  Table2, Users, Clock, Plus, ArrowRightLeft, GitMerge, Split, CheckCircle2,
  X, AlertTriangle, Sparkles, Search, ChevronDown, Check, ShieldCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { groupTablesForFloorPlan } from '../../utils/floorPlanUtils';

export default function ReceptionistFloorPlanPage() {
  const [tables, setTables] = useState([]);
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedTable, setSelectedTable] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Action Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [targetTransferTableNum, setTargetTransferTableNum] = useState('');
  const [selectedMergeTableNums, setSelectedMergeTableNums] = useState([]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchFloorPlan = () => {
    api.getFloorPlan().then(res => {
      const dataList = Array.isArray(res) ? res : (res && res.data ? res.data : []);
      setTables(dataList);
    }).catch(err => console.warn('Floor plan fetch warning:', err.message));
  };

  useEffect(() => {
    fetchFloorPlan();
    const interval = setInterval(fetchFloorPlan, 3000);
    return () => clearInterval(interval);
  }, []);

  const sections = ['All', 'Main Dining', 'Window Section', 'Family Lounge', 'Patio Outdoor'];
  const statuses = ['All', 'Available', 'Occupied', 'Reserved', 'Billing', 'Cleaning'];

  // Detect merged groups and group physical tables into logical card items
  const displayCardItems = useMemo(() => {
    const grouped = groupTablesForFloorPlan(tables);
    return grouped.filter(item => {
      const matchesSection = selectedSection === 'All' || item.section === selectedSection;
      const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
      return matchesSection && matchesStatus;
    });
  }, [tables, selectedSection, selectedStatus]);

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTable || !targetTransferTableNum) return;
    const primaryNum = selectedTable.primaryTableNumber || selectedTable.number;
    try {
      const res = await api.transferTable(primaryNum, targetTransferTableNum);
      if (res.success) {
        showToast(`🔀 Session transferred from ${primaryNum} to ${targetTransferTableNum}!`);
        setIsTransferModalOpen(false);
        setSelectedTable(null);
        fetchFloorPlan();
      }
    } catch (err) {
      alert(`Transfer failed: ${err.message}`);
    }
  };

  const handleMergeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTable || selectedMergeTableNums.length === 0) return;
    const primaryNum = selectedTable.primaryTableNumber || selectedTable.number;
    try {
      const res = await api.mergeTables(primaryNum, selectedMergeTableNums);
      if (res.success) {
        showToast(`🔗 Merged ${primaryNum} with ${selectedMergeTableNums.join(', ')}!`);
        setIsMergeModalOpen(false);
        setSelectedTable(null);
        fetchFloorPlan();
      }
    } catch (err) {
      alert(`Merge failed: ${err.message}`);
    }
  };

  const handleSplitSubmit = async (tableNum) => {
    if (window.confirm(`Are you sure you want to split merged table ${tableNum} back into individual tables?`)) {
      try {
        const res = await api.splitTables(tableNum);
        if (res.success) {
          showToast(`✂️ Merged table ${tableNum} split successfully!`);
          setSelectedTable(null);
          fetchFloorPlan();
        }
      } catch (err) {
        alert(`Split failed: ${err.message}`);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '25px',
          backgroundColor: '#0F2A1D',
          color: '#FFFFFF',
          padding: '0.85rem 1.4rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontWeight: 700,
          border: '1px solid #E07A3C'
        }}>
          <Sparkles size={18} color="#E07A3C" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================== CONTROLS & FILTER BAR ==================== */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justify: 'space-between',
        gap: '1rem'
      }}>
        {/* Section Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginRight: '0.2rem' }}>Section:</span>
          {sections.map(sec => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: selectedSection === sec ? '#0F2A1D' : '#FFFFFF',
                color: selectedSection === sec ? '#FFFFFF' : '#475569',
                cursor: 'pointer'
              }}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginRight: '0.2rem' }}>Status:</span>
          {statuses.map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: selectedStatus === st ? '#E07A3C' : '#FFFFFF',
                color: selectedStatus === st ? '#FFFFFF' : '#64748B',
                cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== LIVE FLOOR PLAN GRID ==================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
        gap: '1.1rem'
      }}>
        {displayCardItems.map(item => {
          const isMerged = item.isMergedGroup;
          const getStatusStyle = (st) => {
            if (st === 'Occupied') return { bg: '#FEF2F2', border: '#FCA5A5', color: '#991B1B', tagBg: '#FEE2E2' };
            if (st === 'Reserved') return { bg: '#FFFBEB', border: '#FCD34D', color: '#92400E', tagBg: '#FEF3C7' };
            if (st === 'Billing') return { bg: '#EFF6FF', border: '#93C5FD', color: '#1E40AF', tagBg: '#DBEAFE' };
            if (st === 'Cleaning') return { bg: '#F3E8FF', border: '#D8B4FE', color: '#6B21A8', tagBg: '#E9D5FF' };
            return { bg: '#F0FDF4', border: '#86EFAC', color: '#166534', tagBg: '#DCFCE7' };
          };
          const style = getStatusStyle(item.status);

          return (
            <div
              key={item.displayId}
              onClick={() => setSelectedTable(item)}
              style={{
                backgroundColor: style.bg,
                border: `2px solid ${style.border}`,
                borderRadius: '18px',
                padding: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F2A1D', fontFamily: 'var(--font-heading)' }}>
                  {item.displayNumber}
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, padding: '0.2rem 0.55rem', borderRadius: '6px', backgroundColor: style.tagBg, color: style.color }}>
                  {item.status}
                </span>
              </div>

              {/* Seating Capacity & Section */}
              <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>
                👥 {item.seats} Seats • {item.section || 'Main Dining'}
              </div>

              {/* Merged Table Label */}
              {isMerged && (
                <div style={{ fontSize: '0.7rem', color: '#C2410C', fontWeight: 800, backgroundColor: '#FFEDD5', padding: '0.2rem 0.55rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <GitMerge size={12} />
                  <span>🔗 Merged Table</span>
                </div>
              )}

              {/* Active Session Info (Shown ONCE!) */}
              {item.status !== 'Available' && item.activeSession ? (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.74rem' }}>
                  <div style={{ fontWeight: 800, color: '#0F2A1D' }}>👤 {item.activeSession.guestName}</div>
                  <div style={{ color: '#64748B', marginTop: '0.1rem' }}>🎉 {item.activeSession.specialOccasion || 'Standard'}</div>
                </div>
              ) : (
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>
                  No guest assigned
                </div>
              )}

              {/* Member Tables Breakdown */}
              {isMerged && (
                <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, marginTop: '0.1rem' }}>
                  Tables: {item.tableNumbers.join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ==================== TABLE DETAILS TOUCH PANEL / MODAL ==================== */}
      {selectedTable && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 24, 19, 0.65)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', maxWidth: '520px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            
            {/* Modal Header */}
            <div style={{ backgroundColor: '#0F2A1D', padding: '1.25rem 1.5rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>
                  {selectedTable.isMergedGroup ? `Merged Group (${selectedTable.displayNumber})` : `Table ${selectedTable.displayNumber} Details`}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#A3C2B3' }}>
                  {selectedTable.seats} Seats • {selectedTable.section}
                </span>
              </div>
              <button onClick={() => setSelectedTable(null)} style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Info */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>CURRENT STATUS</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D', marginTop: '0.2rem' }}>{selectedTable.status}</div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>COMBINED CAPACITY</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2A1D', marginTop: '0.2rem' }}>{selectedTable.seats} Guests</div>
                </div>
              </div>

              {selectedTable.isMergedGroup && (
                <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FDBA74', padding: '0.85rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#C2410C' }}>🔗 MERGED TABLE MEMBERS</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#9A3412', marginTop: '0.2rem' }}>
                    Tables: {selectedTable.tableNumbers.join(', ')}
                  </div>
                </div>
              )}

              {selectedTable.activeSession ? (
                <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1rem', borderRadius: '14px' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>ACTIVE DINING SESSION</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#065F46', marginTop: '0.2rem' }}>{selectedTable.activeSession.guestName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '0.2rem' }}>
                    📞 {selectedTable.activeSession.phone || 'No phone'} • 👥 {selectedTable.activeSession.partySize} Guests
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '0.2rem' }}>
                    🎉 Occasion: {selectedTable.activeSession.specialOccasion || 'Standard Dining'}
                  </div>
                </div>
              ) : (
                <div style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1', padding: '1rem', borderRadius: '14px', textAlign: 'center', color: '#64748B', fontSize: '0.84rem' }}>
                  No active customer session currently associated with {selectedTable.displayNumber}.
                </div>
              )}

              {/* Contextual Touch Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D' }}>Available Table Actions</span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {/* Transfer Button */}
                  {selectedTable.status === 'Occupied' && !selectedTable.isMergedGroup && (
                    <button
                      onClick={() => setIsTransferModalOpen(true)}
                      style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#0F2A1D', fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <ArrowRightLeft size={16} />
                      <span>Transfer Table</span>
                    </button>
                  )}

                  {/* Merge Button */}
                  {!selectedTable.isMergedGroup && (
                    <button
                      onClick={() => setIsMergeModalOpen(true)}
                      style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#0F2A1D', fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <GitMerge size={16} />
                      <span>Merge Table</span>
                    </button>
                  )}

                  {/* Split / Unmerge Button */}
                  {selectedTable.isMergedGroup && (
                    <button
                      onClick={() => handleSplitSubmit(selectedTable.primaryTableNumber)}
                      style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #FCA5A5', backgroundColor: '#FEF2F2', color: '#991B1B', fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <Split size={16} />
                      <span>Unmerge / Split Tables</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ==================== TRANSFER TABLE MODAL ==================== */}
      {isTransferModalOpen && selectedTable && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 24, 19, 0.65)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', maxWidth: '440px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ backgroundColor: '#0F2A1D', padding: '1.25rem', color: '#FFF', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Transfer Session from {selectedTable.number}</h3>
              <button onClick={() => setIsTransferModalOpen(false)} style={{ border: 'none', background: 'transparent', color: '#FFF', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleTransferSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Select Destination Available Table</label>
                <select
                  required
                  value={targetTransferTableNum}
                  onChange={e => setTargetTransferTableNum(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                >
                  <option value="">-- Choose Target Table --</option>
                  {tables.filter(t => t.status === 'Available' && t.number !== selectedTable.number).map(t => (
                    <option key={t.number} value={t.number}>{t.number} ({t.seats} seats - {t.section})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setIsTransferModalOpen(false)} style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFF' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: 'none', backgroundColor: '#0F2A1D', color: '#FFF', fontWeight: 800 }}>Confirm Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MERGE TABLES MODAL ==================== */}
      {isMergeModalOpen && selectedTable && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 24, 19, 0.65)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', maxWidth: '460px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ backgroundColor: '#0F2A1D', padding: '1.25rem', color: '#FFF', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Merge Tables with {selectedTable.number}</h3>
              <button onClick={() => setIsMergeModalOpen(false)} style={{ border: 'none', background: 'transparent', color: '#FFF', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleMergeSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>Select Tables to Combine</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {tables.filter(t => t.number !== selectedTable.number).map(t => {
                    const isChecked = selectedMergeTableNums.includes(t.number);
                    return (
                      <button
                        key={t.number}
                        type="button"
                        onClick={() => {
                          if (isChecked) setSelectedMergeTableNums(selectedMergeTableNums.filter(n => n !== t.number));
                          else setSelectedMergeTableNums([...selectedMergeTableNums, t.number]);
                        }}
                        style={{
                          padding: '0.5rem 0.6rem',
                          borderRadius: '8px',
                          border: isChecked ? '2px solid #E07A3C' : '1px solid #CBD5E1',
                          backgroundColor: isChecked ? '#FFF7ED' : '#F8FAFC',
                          color: '#0F2A1D',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {t.number} ({t.seats}s)
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setIsMergeModalOpen(false)} style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFF' }}>Cancel</button>
                <button type="submit" disabled={selectedMergeTableNums.length === 0} style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: 'none', backgroundColor: '#E07A3C', color: '#FFF', fontWeight: 800, cursor: selectedMergeTableNums.length > 0 ? 'pointer' : 'not-allowed' }}>Confirm Merge</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
