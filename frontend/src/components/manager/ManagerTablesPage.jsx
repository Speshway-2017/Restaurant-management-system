import React, { useState } from 'react';
import { Table2, Plus, QrCode, Eye, CheckCircle2, Users, Clock, RefreshCw, Search, X, Printer, Check, Sparkles, Link2, UploadCloud, Image as ImageIcon, Edit, Trash2, Clipboard } from 'lucide-react';
import { api } from '../../services/api';

export default function AdminTablesPage() {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQrTable, setSelectedQrTable] = useState(null);
  const [qrModalTab, setQrModalTab] = useState('generated'); // 'generated' or 'custom'
  const [customQrUrlInput, setCustomQrUrlInput] = useState('');
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  // Add & Edit Table Modals
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null); // Table being edited
  const [toastMessage, setToastMessage] = useState(null);

  const [tables, setTables] = useState([
    { id: 1, num: 'T-01', zone: 'Main Dining', cap: 4, status: 'Occupied', orderId: 'ORD-8938', amount: '₹1,450', elapsed: '38 mins', customer: 'Deepak J.', qrPlaced: true, customQrUrl: '' },
    { id: 2, num: 'T-02', zone: 'Main Dining', cap: 2, status: 'Occupied', orderId: 'ORD-8943', amount: '₹540', elapsed: '14 mins', customer: 'Priya P.', qrPlaced: true, customQrUrl: '' },
    { id: 3, num: 'T-03', zone: 'Main Dining', cap: 4, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-', qrPlaced: true, customQrUrl: '' },
    { id: 4, num: 'T-04', zone: 'Main Dining', cap: 6, status: 'Occupied', orderId: 'ORD-8941', amount: '₹1,240', elapsed: '24 mins', customer: 'Ananya R.', qrPlaced: true, customQrUrl: '' },
    { id: 5, num: 'T-05', zone: 'Window Section', cap: 2, status: 'Reserved', orderId: 'RES-104', amount: 'Pre-booked', elapsed: '7:30 PM', customer: 'Dr. Mehta', qrPlaced: true, customQrUrl: '' },
    { id: 6, num: 'T-06', zone: 'Window Section', cap: 4, status: 'Cleaning', orderId: null, amount: '-', elapsed: '5 mins ago', customer: '-', qrPlaced: false, customQrUrl: '' },
    { id: 7, num: 'T-07', zone: 'Window Section', cap: 4, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-', qrPlaced: true, customQrUrl: '' },
    { id: 8, num: 'T-08', zone: 'Family Lounge', cap: 8, status: 'Occupied', orderId: 'ORD-8942', amount: '₹2,840', elapsed: '42 mins', customer: 'Amitabh S.', qrPlaced: true, customQrUrl: '' },
    { id: 9, num: 'T-09', zone: 'Family Lounge', cap: 6, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-', qrPlaced: true, customQrUrl: '' },
    { id: 10, num: 'T-10', zone: 'Patio Outdoor', cap: 4, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-', qrPlaced: true, customQrUrl: '' },
    { id: 11, num: 'T-11', zone: 'Patio Outdoor', cap: 2, status: 'Reserved', orderId: 'RES-108', amount: 'Pre-booked', elapsed: '8:00 PM', customer: 'Kapoor Party', qrPlaced: true, customQrUrl: '' },
    { id: 12, num: 'T-12', zone: 'Patio Outdoor', cap: 4, status: 'Occupied', orderId: 'ORD-8944', amount: '₹760', elapsed: '18 mins', customer: 'Rahul S.', qrPlaced: true, customQrUrl: '' },
  ]);

  const [newTableData, setNewTableData] = useState({
    num: '',
    zone: 'Main Dining',
    cap: 4,
    status: 'Available'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [backendQrDataUrl, setBackendQrDataUrl] = useState('');

  // View QR Modal (integrates backend node qrcode package)
  const handleOpenQrModal = async (tbl) => {
    setSelectedQrTable(tbl);
    setCustomQrUrlInput(tbl.customQrUrl || '');
    setQrModalTab(tbl.customQrUrl ? 'custom' : 'generated');

    // Default dynamic scannable QR link
    const targetLink = `http://localhost:5173/menu?table=${tbl.num}`;
    const defaultQrImage = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(targetLink)}`;
    setBackendQrDataUrl(defaultQrImage);

    try {
      const res = await api.generateTableQr(tbl.num, targetLink);
      if (res && res.qrDataUrl) {
        setBackendQrDataUrl(res.qrDataUrl);
      }
    } catch (err) {
      console.warn('Using fallback dynamic QR Code image generator:', err.message);
    }
  };

  // Open Paste QR Modal Directly
  const handleOpenPasteQrModal = (tbl) => {
    setSelectedQrTable(tbl);
    setCustomQrUrlInput(tbl.customQrUrl || '');
    setQrModalTab('custom');
  };

  // Save Custom QR Code
  const handleSaveCustomQr = (tblId) => {
    if (!customQrUrlInput.trim()) {
      alert('Please paste or upload a valid QR image link.');
      return;
    }
    const cleanUrl = customQrUrlInput.trim();
    setTables(tables.map(t => t.id === tblId ? { ...t, customQrUrl: cleanUrl, qrPlaced: true } : t));
    const target = tables.find(t => t.id === tblId);
    showToast(`Custom QR Code saved & placed on ${target?.num || 'Table'}!`);
    setSelectedQrTable(null);
  };

  // Delete / Clear Custom QR Code
  const handleDeleteCustomQr = (tblId) => {
    if (window.confirm('Are you sure you want to delete this custom QR code? It will revert to system auto-generated QR.')) {
      setTables(tables.map(t => t.id === tblId ? { ...t, customQrUrl: '' } : t));
      setCustomQrUrlInput('');
      setQrModalTab('generated');
      showToast('Custom QR Code deleted. Reverted to system auto-generated QR.');
    }
  };

  // Place/Activate QR Code on Table
  const handlePlaceQrOnTable = (tblId) => {
    setTables(tables.map(t => t.id === tblId ? { ...t, qrPlaced: true } : t));
    const target = tables.find(t => t.id === tblId);
    showToast(`QR Code Standee activated & placed on ${target?.num || 'Table'}!`);
  };

  // Toggle Table Status
  const handleToggleTableStatus = (tblId, nextStatus) => {
    setTables(tables.map(t => t.id === tblId ? { ...t, status: nextStatus } : t));
    const target = tables.find(t => t.id === tblId);
    showToast(`${target?.num} status updated to ${nextStatus}!`);
  };

  // Edit Table
  const handleOpenEditModal = (tbl) => {
    setEditingTable({ ...tbl });
  };

  const handleSaveEditedTable = (e) => {
    e.preventDefault();
    if (!editingTable.num) return;
    setTables(tables.map(t => t.id === editingTable.id ? editingTable : t));
    showToast(`${editingTable.num} updated successfully!`);
    setEditingTable(null);
  };

  // Delete Table
  const handleDeleteTable = (tblId, tblNum) => {
    if (window.confirm(`Are you sure you want to delete ${tblNum}?`)) {
      setTables(tables.filter(t => t.id !== tblId));
      showToast(`${tblNum} has been deleted.`);
    }
  };

  // Create Table
  const handleCreateNewTable = (e) => {
    e.preventDefault();
    if (!newTableData.num) {
      alert('Please enter a Table Number (e.g., T-13).');
      return;
    }
    const nextNum = newTableData.num.startsWith('T-') ? newTableData.num : `T-${newTableData.num}`;
    const newTbl = {
      id: Date.now(),
      num: nextNum,
      zone: newTableData.zone,
      cap: Number(newTableData.cap) || 4,
      status: newTableData.status || 'Available',
      orderId: null,
      amount: '-',
      elapsed: '-',
      customer: '-',
      qrPlaced: true,
      customQrUrl: ''
    };

    setTables([...tables, newTbl]);
    setIsAddTableModalOpen(false);
    setNewTableData({ num: '', zone: 'Main Dining', cap: 4, status: 'Available' });
    showToast(`New ${nextNum} added & QR Code placed successfully!`);
  };

  const filteredTables = tables.filter(t => {
    const matchesStatus = selectedStatusFilter === 'All' || t.status === selectedStatusFilter;
    const matchesSearch = t.num.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.customer && t.customer.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const occupiedCount = tables.filter(t => t.status === 'Occupied').length;
  const availableCount = tables.filter(t => t.status === 'Available').length;
  const reservedCount = tables.filter(t => t.status === 'Reserved').length;
  const cleaningCount = tables.filter(t => t.status === 'Cleaning').length;

  return (
    <div className="admin-subpage-container">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#1E4636',
          color: '#FFFFFF',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          fontSize: '0.88rem'
        }}>
          <CheckCircle2 size={18} color="#F2C14E" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="admin-dashboard-header">
        <div>
          <div className="page-breadcrumb-bar">
            <span>Dashboard</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Table Management</span>
          </div>
          <h1 className="admin-page-title">Table Management</h1>
          <p className="admin-page-subtitle">View, edit, paste, delete & manage dining table QR code standees for digital self-service ordering.</p>
        </div>
        <div className="admin-header-actions">
          <button className="btn btn-primary" onClick={() => setIsAddTableModalOpen(true)}>
            <Plus size={16} />
            <span>Add New Table</span>
          </button>
        </div>
      </div>

      {/* Search Bar First, Then Filter Tabs & Summary Strip */}
      <div className="admin-card mb-3" style={{ padding: '0.65rem 1.25rem' }}>
        <div className="admin-filter-bar-flex" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="admin-header-search-box" style={{ width: '240px', flexShrink: 0 }}>
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search table no or zone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-header-search-input"
            />
          </div>

          <div className="admin-pill-selector">
            {['All', 'Occupied', 'Available', 'Reserved', 'Cleaning'].map((st) => (
              <button
                key={st}
                className={`admin-pill-btn ${selectedStatusFilter === st ? 'is-active' : ''}`}
                onClick={() => setSelectedStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="admin-table-summary-bar" style={{ margin: 0 }}>
            <div className="summary-pill is-occupied">
              <span className="pill-dot"></span>
              <span>{occupiedCount} Occupied</span>
            </div>
            <div className="summary-pill is-available">
              <span className="pill-dot"></span>
              <span>{availableCount} Available</span>
            </div>
            <div className="summary-pill is-reserved">
              <span className="pill-dot"></span>
              <span>{reservedCount} Reserved</span>
            </div>
            <div className="summary-pill is-cleaning">
              <span className="pill-dot"></span>
              <span>{cleaningCount} Cleaning</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floor Plan Visual Grid */}
      <div className="admin-floor-plan-grid">
        {filteredTables.map((tbl) => (
          <div key={tbl.num} className={`trendy-table-card is-status-${tbl.status.toLowerCase()}`}>
            
            {/* Header: Table Number Badge (Left) & Status Selector (Right) */}
            <div className="trendy-card-header">
              <div className="tbl-badge-circle">
                <Table2 size={16} />
                <span className="tbl-num-text">{tbl.num}</span>
              </div>

              {/* Interactive Glowing Status Selector */}
              <select
                value={tbl.status}
                onChange={(e) => handleToggleTableStatus(tbl.id, e.target.value)}
                className={`trendy-status-pill is-${tbl.status.toLowerCase()}`}
              >
                <option value="Available">🟢 Available</option>
                <option value="Occupied">🔴 Occupied</option>
                <option value="Reserved">🟡 Reserved</option>
                <option value="Cleaning">⚪ Cleaning</option>
              </select>
            </div>

            {/* Card Content Body */}
            <div className="trendy-card-body">
              <div className="trendy-meta-pills">
                <span className="meta-pill is-zone">
                  <span>📍 {tbl.zone}</span>
                </span>

                <span className="meta-pill">
                  <Users size={13} />
                  <span>{tbl.cap} Seats</span>
                </span>

                {tbl.qrPlaced ? (
                  <span className="meta-pill is-active-qr">
                    <Check size={13} />
                    <span>{tbl.customQrUrl ? 'Custom QR' : 'QR Active'}</span>
                  </span>
                ) : (
                  <span className="meta-pill is-warn-qr">
                    <span>⚠️ No QR</span>
                  </span>
                )}
              </div>

              {/* Occupied Live Order Glass Ticket */}
              {tbl.status === 'Occupied' && (
                <div className="trendy-occupied-ticket">
                  <div className="ticket-header">
                    <span className="ticket-code">{tbl.orderId}</span>
                    <span className="ticket-timer"><Clock size={12} /> {tbl.elapsed}</span>
                  </div>
                  <div className="ticket-body">
                    <span className="ticket-guest-name">{tbl.customer}</span>
                    <span className="ticket-price-tag">{tbl.amount}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Trendy Dual-Action Controls Bar */}
            <div className="trendy-card-actions">
              <div className="primary-actions-grid">
                <button 
                  className="trendy-btn-primary"
                  onClick={() => handleOpenQrModal(tbl)}
                >
                  <Eye size={14} />
                  <span>View QR</span>
                </button>

                <button 
                  className="trendy-btn-orange"
                  onClick={() => handleOpenPasteQrModal(tbl)}
                >
                  <Clipboard size={14} />
                  <span>Paste QR</span>
                </button>
              </div>

              <div className="secondary-tools-row">
                <button 
                  className="trendy-btn-ghost"
                  onClick={() => handleOpenEditModal(tbl)}
                >
                  <Edit size={13} />
                  <span>Edit</span>
                </button>

                <button 
                  className="trendy-btn-danger"
                  onClick={() => handleDeleteTable(tbl.id, tbl.num)}
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* ================= MODAL 1: VIEW, PASTE, EDIT, DELETE QR CODE MODAL ================= */}
      {selectedQrTable && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedQrTable(null)}>
          <div className="admin-modal-card text-center" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            
            {/* Modal Header */}
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Table QR Code — {selectedQrTable.num}</h3>
              <button className="admin-modal-close" onClick={() => setSelectedQrTable(null)}>×</button>
            </div>

            {/* Modal Sub-Tabs: View Auto-Generated vs Paste/Upload Custom QR */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FAF6EE', padding: '0.35rem 0.5rem', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => setQrModalTab('generated')}
                style={{
                  flex: 1,
                  padding: '0.45rem 0.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: qrModalTab === 'generated' ? '#1E4636' : 'transparent',
                  color: qrModalTab === 'generated' ? '#FFFFFF' : '#1E4636',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                <Eye size={14} />
                <span>View System QR</span>
              </button>

              <button
                type="button"
                onClick={() => setQrModalTab('custom')}
                style={{
                  flex: 1,
                  padding: '0.45rem 0.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: qrModalTab === 'custom' ? '#FF8A00' : 'transparent',
                  color: qrModalTab === 'custom' ? '#FFFFFF' : '#1E4636',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                <Clipboard size={14} />
                <span>Paste Custom QR</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="admin-modal-body" style={{ padding: '1.25rem 1.4rem' }}>
              
              {/* TAB 1: VIEW AUTO GENERATED QR CODE */}
              {qrModalTab === 'generated' && (
                <>
                  <div 
                    className="qr-box-frame" 
                    style={{ 
                      border: '2.5px solid #0F2A1D', 
                      borderRadius: '14px', 
                      padding: '1rem 1.25rem', 
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 8px 24px rgba(15, 42, 29, 0.12)',
                      display: 'inline-block',
                      margin: '0 auto'
                    }}
                  >
                    {selectedQrTable.customQrUrl ? (
                      <img 
                        src={selectedQrTable.customQrUrl} 
                        alt={`Custom QR Code for ${selectedQrTable.num}`} 
                        style={{ width: '135px', height: '135px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                      />
                    ) : backendQrDataUrl ? (
                      <img 
                        src={backendQrDataUrl} 
                        alt={`Backend Generated QR Code for ${selectedQrTable.num}`} 
                        style={{ width: '135px', height: '135px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                      />
                    ) : (
                      <QrCode size={135} color="#0F2A1D" style={{ margin: '0 auto' }} />
                    )}
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F2A1D', marginTop: '0.5rem' }}>
                      {selectedQrTable.num} • SCAN TO ORDER & PAY
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.15rem' }}>
                      Flavora RestoOS Table QR System
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', textAlign: 'center', backgroundColor: '#F0F7F3', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #D5E8DD' }}>
                    <span style={{ fontSize: '0.8rem', color: '#0F2A1D', fontWeight: 700, lineHeight: 1.4 }}>
                      Place this QR Standee on {selectedQrTable.num} ({selectedQrTable.zone}). Guests scanning this QR can browse the menu & place orders instantly.
                    </span>
                  </div>

                  {selectedQrTable.customQrUrl && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomQr(selectedQrTable.id)}
                      style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', marginTop: '0.75rem' }}
                    >
                      Delete Custom QR & Revert to System QR
                    </button>
                  )}
                </>
              )}

              {/* TAB 2: PASTE / UPLOAD CUSTOM QR IMAGE */}
              {qrModalTab === 'custom' && (
                <div style={{ width: '100%', textAlign: 'left' }}>
                  <div style={{ marginBottom: '1rem', backgroundColor: '#FFF7ED', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #FFEDD5', fontSize: '0.78rem', color: '#C2410C', fontWeight: 600 }}>
                    📋 Paste a custom QR code image URL or upload your pre-printed table QR standee image below.
                  </div>

                  {/* Input 1: Paste Link */}
                  <div className="admin-form-group mb-3">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                      🔗 Paste QR Image Link / URL *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Paste image link e.g. https://..."
                        value={customQrUrlInput}
                        onChange={(e) => setCustomQrUrlInput(e.target.value)}
                        className="form-control"
                        style={{ paddingRight: '2.5rem', fontSize: '0.85rem' }}
                        autoFocus
                      />
                      <Clipboard size={16} color="#718096" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>

                  {/* Input 2: Upload File */}
                  <div className="admin-form-group mb-3">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                      📁 Or Upload Custom QR Image File (Cloudinary)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            if (event.target?.result) {
                              setIsUploadingQr(true);
                              showToast('Uploading custom QR image...');
                              try {
                                const res = await api.uploadImage(event.target.result, 'table_qrs');
                                if (res && res.url) {
                                  setCustomQrUrlInput(res.url);
                                  showToast('Custom QR image uploaded to Cloudinary!');
                                }
                              } catch (err) {
                                setCustomQrUrlInput(event.target.result);
                              } finally {
                                setIsUploadingQr(false);
                              }
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="form-control"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                    />
                  </div>

                  {/* Live Custom QR Image Preview */}
                  {customQrUrlInput && (
                    <div style={{ textAlign: 'center', margin: '0.85rem 0', backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '10px', border: '1px dashed #CBD5E1' }}>
                      <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700, marginBottom: '0.4rem' }}>
                        LIVE CUSTOM QR PREVIEW ({selectedQrTable.num})
                      </div>
                      <img
                        src={customQrUrlInput}
                        alt="Custom QR Preview"
                        style={{ width: '120px', height: '120px', objectFit: 'contain', margin: '0 auto', display: 'block', borderRadius: '8px', border: '1.5px solid #1E4636' }}
                      />
                    </div>
                  )}

                  {selectedQrTable.customQrUrl && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomQr(selectedQrTable.id)}
                      style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', display: 'block', marginTop: '0.5rem' }}
                    >
                      Delete Custom QR Code
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="admin-modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedQrTable(null)} style={{ padding: '0.55rem 1.25rem' }}>
                Close
              </button>
              
              {qrModalTab === 'custom' ? (
                <button 
                  className="btn btn-primary"
                  onClick={() => handleSaveCustomQr(selectedQrTable.id)}
                  style={{ backgroundColor: '#FF8A00', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.4rem' }}
                >
                  <Check size={16} />
                  <span>Save Custom QR</span>
                </button>
              ) : (
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    handlePlaceQrOnTable(selectedQrTable.id);
                    setSelectedQrTable(null);
                  }}
                  style={{ backgroundColor: '#FF8A00', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.4rem' }}
                >
                  <Printer size={15} />
                  <span>Place QR on Table</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDIT TABLE & QR DETAILS ================= */}
      {editingTable && (
        <div className="admin-modal-backdrop" onClick={() => setEditingTable(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', borderRadius: '16px' }}>
            <div className="admin-modal-header" style={{ backgroundColor: '#0F2A1D', color: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit size={20} color="#FF8A00" />
                <h3 className="admin-modal-title" style={{ color: '#FFFFFF', fontSize: '1.1rem' }}>Edit Table — {editingTable.num}</h3>
              </div>
              <button className="admin-modal-close" onClick={() => setEditingTable(null)} style={{ color: '#FFFFFF' }}>×</button>
            </div>

            <form onSubmit={handleSaveEditedTable} style={{ padding: '1.5rem' }}>
              <div className="admin-form-group mb-3">
                <label className="form-label" style={{ fontWeight: 700 }}>Table Number / Code *</label>
                <input
                  type="text"
                  value={editingTable.num}
                  onChange={(e) => setEditingTable({ ...editingTable, num: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="admin-form-group mb-3">
                <label className="form-label" style={{ fontWeight: 700 }}>Dining Zone / Section</label>
                <select
                  value={editingTable.zone}
                  onChange={(e) => setEditingTable({ ...editingTable, zone: e.target.value })}
                  className="form-control"
                >
                  <option value="Main Dining">Main Dining</option>
                  <option value="Window Section">Window Section</option>
                  <option value="Family Lounge">Family Lounge</option>
                  <option value="Patio Outdoor">Patio Outdoor</option>
                </select>
              </div>

              <div className="admin-form-group mb-3">
                <label className="form-label" style={{ fontWeight: 700 }}>Seating Capacity (Seats)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={editingTable.cap}
                  onChange={(e) => setEditingTable({ ...editingTable, cap: Number(e.target.value) })}
                  className="form-control"
                />
              </div>

              <div className="admin-form-group mb-4">
                <label className="form-label" style={{ fontWeight: 700 }}>Custom QR Image Link / URL</label>
                <input
                  type="text"
                  placeholder="Paste custom QR link e.g. https://..."
                  value={editingTable.customQrUrl || ''}
                  onChange={(e) => setEditingTable({ ...editingTable, customQrUrl: e.target.value, qrPlaced: true })}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingTable(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#0F2A1D', color: '#FFFFFF' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ADD NEW TABLE MODAL ================= */}
      {isAddTableModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsAddTableModalOpen(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', borderRadius: '16px' }}>
            <div className="admin-modal-header" style={{ backgroundColor: '#0F2A1D', color: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Table2 size={20} color="#FF8A00" />
                <h3 className="admin-modal-title" style={{ color: '#FFFFFF', fontSize: '1.1rem' }}>Add New Dining Table</h3>
              </div>
              <button className="admin-modal-close" onClick={() => setIsAddTableModalOpen(false)} style={{ color: '#FFFFFF' }}>×</button>
            </div>

            <form onSubmit={handleCreateNewTable} style={{ padding: '1.5rem' }}>
              <div className="admin-form-group mb-3">
                <label className="form-label" style={{ fontWeight: 700 }}>Table Number / Code *</label>
                <input
                  type="text"
                  placeholder="e.g. T-13"
                  value={newTableData.num}
                  onChange={(e) => setNewTableData({ ...newTableData, num: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="admin-form-group mb-3">
                <label className="form-label" style={{ fontWeight: 700 }}>Dining Zone / Section</label>
                <select
                  value={newTableData.zone}
                  onChange={(e) => setNewTableData({ ...newTableData, zone: e.target.value })}
                  className="form-control"
                >
                  <option value="Main Dining">Main Dining</option>
                  <option value="Window Section">Window Section</option>
                  <option value="Family Lounge">Family Lounge</option>
                  <option value="Patio Outdoor">Patio Outdoor</option>
                </select>
              </div>

              <div className="admin-form-group mb-4">
                <label className="form-label" style={{ fontWeight: 700 }}>Seating Capacity (Seats)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newTableData.cap}
                  onChange={(e) => setNewTableData({ ...newTableData, cap: e.target.value })}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsAddTableModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#0F2A1D', color: '#FFFFFF' }}>
                  Create & Place QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
