import React, { useState } from 'react';
import { Table2, Plus, QrCode, Eye, EyeOff, CheckCircle2, Users, Clock, RefreshCw, Search, X, Printer, Check, Sparkles, Link2, UploadCloud, Image as ImageIcon, Edit, Trash2, Clipboard, MoreVertical } from 'lucide-react';
import { api } from '../../services/api';

export default function ManagerTablesPage() {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQrTable, setSelectedQrTable] = useState(null);
  const [qrModalTab, setQrModalTab] = useState('generated'); // 'generated' or 'custom'
  const [customQrUrlInput, setCustomQrUrlInput] = useState('');
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  // Add & Edit Table Modals
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null); // Table being edited
  const [toastMessage, setToastMessage] = useState(null);

  const defaultTables = [
    { id: 1, num: 'T-01', zone: 'Main Dining', cap: 4, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-', qrPlaced: true, customQrUrl: '' },
    { id: 2, num: 'T-02', zone: 'Main Dining', cap: 2, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-', qrPlaced: true, customQrUrl: '' },
    { id: 3, num: 'T-03', zone: 'Main Dining', cap: 4, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-', qrPlaced: true, customQrUrl: '' },
    { id: 4, num: 'T-04', zone: 'Main Dining', cap: 6, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-', qrPlaced: true, customQrUrl: '' },
    { id: 5, num: 'T-05', zone: 'Window Section', cap: 2, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-', qrPlaced: true, customQrUrl: '' },
    { id: 6, num: 'T-06', zone: 'Window Section', cap: 4, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-', qrPlaced: true, customQrUrl: '' },
    { id: 7, num: 'T-07', zone: 'Window Section', cap: 4, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-', qrPlaced: true, customQrUrl: '' },
    { id: 8, num: 'T-08', zone: 'Family Lounge', cap: 8, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-', qrPlaced: true, customQrUrl: '' },
    { id: 9, num: 'T-09', zone: 'Family Lounge', cap: 6, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-', qrPlaced: true, customQrUrl: '' },
    { id: 10, num: 'T-10', zone: 'Patio Outdoor', cap: 4, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-', qrPlaced: true, customQrUrl: '' },
    { id: 11, num: 'T-11', zone: 'Patio Outdoor', cap: 2, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-', qrPlaced: true, customQrUrl: '' },
    { id: 12, num: 'T-12', zone: 'Patio Outdoor', cap: 4, status: 'Available', orderId: null, amount: '-', elapsed: '-', customer: '-', qrPlaced: true, customQrUrl: '' },
  ];

  const sanitizeTableItem = (tbl) => {
    const isMockCustomer = ['Deepak J.', 'Priya P.', 'Ananya R.', 'Dr. Mehta', 'Amitabh S.', 'Kapoor Party', 'Rahul S.'].includes(tbl.customer);
    const isMockOrder = typeof tbl.orderId === 'string' && (tbl.orderId.startsWith('ORD-89') || tbl.orderId.startsWith('RES-1'));
    if (isMockCustomer || isMockOrder) {
      return {
        ...tbl,
        status: 'Available',
        customer: '-',
        orderId: null,
        amount: '-',
        elapsed: '-'
      };
    }
    return tbl;
  };

  const syncTableOrdersWithLocalStorage = (rawTables) => {
    let managerStatusMap = {};
    try {
      const savedMgr = localStorage.getItem('flavora_manager_orders');
      if (savedMgr) {
        const parsed = JSON.parse(savedMgr);
        if (Array.isArray(parsed)) {
          parsed.forEach(o => {
            if (o.id) managerStatusMap[o.id] = o.status;
          });
        }
      }
    } catch (e) {}

    return rawTables.map(tbl => {
      const cleanNum = (tbl.num || '').toUpperCase().replace('TABLE', '').replace('T-', '').trim();
      const possibleKeys = [
        `flavora_table_orders_${tbl.num}`,
        `flavora_table_orders_T-${cleanNum}`,
        `flavora_table_orders_T-${cleanNum.padStart(2, '0')}`,
        `flavora_table_orders_${cleanNum}`
      ];

      let foundOrders = [];
      for (const k of possibleKeys) {
        try {
          const s = localStorage.getItem(k);
          if (s) {
            const p = JSON.parse(s);
            if (Array.isArray(p) && p.length > 0) {
              foundOrders = p;
              break;
            }
          }
        } catch (e) {}
      }

      // Filter out completed and cancelled orders (check BOTH order status AND managerStatusMap)
      const activeOrdersInStorage = foundOrders.filter(o => {
        if (!o) return false;
        const id = o.orderId || o.id;
        const mgrStatus = managerStatusMap[id];
        if (mgrStatus === 'Completed' || mgrStatus === 'Cancelled') return false;
        return o.status !== 'Completed' && o.status !== 'Cancelled';
      });

      if (activeOrdersInStorage.length > 0) {
        const latest = activeOrdersInStorage[activeOrdersInStorage.length - 1];
        return {
          ...tbl,
          status: 'Occupied',
          cleaningUntil: null,
          orderId: latest.orderId || tbl.orderId || 'ORD-QR',
          amount: (latest.total !== undefined && latest.total !== null) ? `₹${latest.total}` : (latest.totalAmount ? `₹${latest.totalAmount}` : (tbl.amount !== '-' ? tbl.amount : '₹0')),
          customer: latest.customer || latest.guestName || (tbl.customer && tbl.customer !== '-' ? tbl.customer : 'Guest Diner'),
          guest: latest.customer || latest.guestName || (tbl.guest && tbl.guest !== '-' ? tbl.guest : 'Guest Diner'),
          elapsed: 'Just Now'
        };
      } else if (tbl.status === 'Occupied') {
        return {
          ...tbl,
          cleaningUntil: null
        };
      }
      return tbl;
    });
  };

  const [tables, setTables] = useState([]);

  React.useEffect(() => {
    const handleSync = () => {
      const extractDigits = (val) => {
        if (!val) return '';
        const d = String(val).replace(/[^0-9]/g, '');
        return d ? String(parseInt(d, 10)) : '';
      };

      Promise.all([api.getTables().catch(() => []), api.getOrders().catch(() => [])])
        .then(([dbTables, dbOrders]) => {
          const combinedOrders = Array.isArray(dbOrders) ? [...dbOrders] : [];
          const baseList = (dbTables && dbTables.length > 0) ? dbTables : [];

          let savedLocalTables = [];
          try {
            const raw = localStorage.getItem('flavora_tables');
            if (raw) savedLocalTables = JSON.parse(raw);
          } catch (e) {}

          const mapped = baseList.map(dbT => {
            const cleanT = extractDigits(dbT.number || dbT.name);

            // Preserve QR placement state from localStorage or default to TRUE
            const savedT = savedLocalTables.find(st => 
              (st.id && dbT._id && String(st.id) === String(dbT._id)) || 
              (st.num && dbT.number && extractDigits(st.num) === cleanT)
            );

            const isQrPlaced = savedT && savedT.qrPlaced !== undefined ? Boolean(savedT.qrPlaced) : (dbT.qrPlaced !== undefined ? Boolean(dbT.qrPlaced) : true);
            const customQr = savedT && savedT.customQrUrl ? savedT.customQrUrl : (dbT.customQrUrl || '');

            const activeOrder = combinedOrders.find(o => {
              const oClean = extractDigits(o.tableNumber || o.table);
              return oClean && cleanT && oClean === cleanT && o.status !== 'Completed' && o.status !== 'Cancelled' && o.status !== 'Paid' && o.payment !== 'Completed' && o.payment !== 'Paid';
            });

            if (activeOrder) {
              const custName = activeOrder.customer || activeOrder.guestName || 'Guest Diner';
              const amtVal = `₹${activeOrder.total || activeOrder.totalAmount || 0}`;
              
              return {
                id: dbT._id || dbT.id,
                num: dbT.number || dbT.name || `T-${cleanT}`,
                zone: dbT.section || 'Main Dining',
                cap: dbT.seats || 4,
                status: (activeOrder.status === 'Bill Generated' || activeOrder.payment === 'Awaiting Payment') ? 'Bill Generated' : 'Occupied',
                cleaningUntil: null,
                orderId: activeOrder.orderId || activeOrder.id || activeOrder._id,
                amount: amtVal,
                customer: custName,
                guest: custName,
                qrPlaced: isQrPlaced,
                customQrUrl: customQr
              };
            }

            return {
              id: dbT._id || dbT.id,
              num: dbT.number || dbT.name || `T-${cleanT}`,
              zone: dbT.section || 'Main Dining',
              cap: dbT.seats || 4,
              status: dbT.status || 'Available',
              cleaningUntil: dbT.cleaningUntil ? new Date(dbT.cleaningUntil).getTime() : null,
              orderId: null,
              customer: '-',
              guest: '-',
              amount: '-',
              elapsed: '-',
              qrPlaced: isQrPlaced,
              customQrUrl: customQr
            };
          });

          setTables(mapped);
        });
    };

    handleSync();
    const interval = setInterval(handleSync, 1000);
    window.addEventListener('flavora_tables_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('flavora_tables_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const updateAndSaveTables = (newTablesList) => {
    setTables(newTablesList);
    try {
      localStorage.setItem('flavora_tables', JSON.stringify(newTablesList));
      window.dispatchEvent(new Event('flavora_tables_updated'));
    } catch (e) {}
  };

  const [newTableData, setNewTableData] = useState({
    num: '',
    zone: '',
    cap: 4,
    status: 'Available'
  });
  const [isCustomZone, setIsCustomZone] = useState(false);
  const [customZoneName, setCustomZoneName] = useState('');
  const [isEditCustomZone, setIsEditCustomZone] = useState(false);
  const [editCustomZoneName, setEditCustomZoneName] = useState('');

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

    // Default dynamic scannable QR link (Uses local Wi-Fi IP address 192.168.1.34 for mobile accessibility)
    const host = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? '192.168.1.34'
      : window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : ':5173';
    const targetLink = `${window.location.protocol}//${host}${port}/menu?table=${encodeURIComponent(tbl.num)}`;
    const defaultQrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetLink)}`;
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
    const updated = tables.map(t => t.id === tblId ? { ...t, customQrUrl: cleanUrl, qrPlaced: true } : t);
    updateAndSaveTables(updated);
    const target = tables.find(t => t.id === tblId);
    showToast(`Custom QR Code saved & placed on ${target?.num || 'Table'}!`);
    setSelectedQrTable(null);
  };

  // Delete / Clear Custom QR Code
  const handleDeleteCustomQr = (tblId) => {
    if (window.confirm('Are you sure you want to delete this custom QR code? It will revert to system auto-generated QR.')) {
      const updated = tables.map(t => t.id === tblId ? { ...t, customQrUrl: '' } : t);
      updateAndSaveTables(updated);
      setCustomQrUrlInput('');
      setQrModalTab('generated');
      showToast('Custom QR Code deleted. Reverted to system auto-generated QR.');
    }
  };

  // Place/Activate or Block QR Code on Table
  const handleToggleBlockQr = (tblId) => {
    const target = tables.find(t => t.id === tblId);
    if (!target) return;
    if (target.status === 'Occupied') {
      alert(`⚠️ Cannot modify QR status for ${target.num}. Table is currently OCCUPIED by active dining session!`);
      showToast(`⚠️ Cannot block or change QR status while ${target.num} is Occupied.`);
      return;
    }
    const isNowBlocked = target.qrPlaced;
    const updated = tables.map(t => t.id === tblId ? { ...t, qrPlaced: !isNowBlocked } : t);
    updateAndSaveTables(updated);
    if (isNowBlocked) {
      showToast(`🚫 QR Code blocked & deactivated for ${target.num}!`);
    } else {
      showToast(`🟢 QR Code activated & placed on ${target.num}!`);
    }
  };

  const handlePlaceQrOnTable = (tblId) => {
    handleToggleBlockQr(tblId);
  };

  // Toggle Table Status
  const handleToggleTableStatus = (tblId, nextStatus) => {
    const updated = tables.map(t => t.id === tblId ? { ...t, status: nextStatus } : t);
    updateAndSaveTables(updated);
    const target = tables.find(t => t.id === tblId);
    showToast(`${target?.num} status updated to ${nextStatus}!`);
  };

  // Edit Table
  const handleOpenEditModal = (tbl) => {
    if (tbl.status === 'Occupied') {
      alert(`⚠️ Cannot edit ${tbl.num}. Table is currently OCCUPIED by active dining session!`);
      showToast(`⚠️ Cannot edit ${tbl.num} while table is Occupied.`);
      return;
    }
    setEditingTable({ ...tbl });
    setIsEditCustomZone(false);
    setEditCustomZoneName('');
  };

  const handleSaveEditedTable = (e) => {
    e.preventDefault();
    if (!editingTable.num) return;
    const finalZone = isEditCustomZone ? editCustomZoneName.trim() : (editingTable.zone ? editingTable.zone.trim() : '');
    const updatedTbl = { ...editingTable, zone: finalZone };
    const updated = tables.map(t => t.id === editingTable.id ? updatedTbl : t);
    updateAndSaveTables(updated);
    showToast(`${editingTable.num} updated successfully!`);
    setEditingTable(null);
    setIsEditCustomZone(false);
    setEditCustomZoneName('');
  };

  // Delete Table
  const handleDeleteTable = (tblId, tblNum) => {
    const target = tables.find(t => t.id === tblId);
    if (target && target.status === 'Occupied') {
      alert(`⚠️ Cannot delete ${tblNum}. Table is currently OCCUPIED by active dining session!`);
      showToast(`⚠️ Cannot delete ${tblNum} while table is Occupied.`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${tblNum}?`)) {
      const updated = tables.filter(t => t.id !== tblId);
      updateAndSaveTables(updated);
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
    const finalZone = isCustomZone ? customZoneName.trim() : (newTableData.zone ? newTableData.zone.trim() : '');

    const newTbl = {
      id: Date.now(),
      num: nextNum,
      zone: finalZone,
      cap: Number(newTableData.cap) || 4,
      status: newTableData.status || 'Available',
      orderId: null,
      amount: '-',
      elapsed: '-',
      customer: '-',
      qrPlaced: true,
      customQrUrl: ''
    };
    const updated = [newTbl, ...tables];
    updateAndSaveTables(updated);
    setIsAddTableModalOpen(false);
    setIsCustomZone(false);
    setCustomZoneName('');
    setNewTableData({ num: '', zone: '', cap: 4, status: 'Available' });
    showToast(finalZone ? `New ${nextNum} added in ${finalZone} zone successfully!` : `New ${nextNum} added successfully!`);
  };

  const filteredTables = tables.filter(t => {
    const matchesStatus = selectedStatusFilter === 'All' || t.status === selectedStatusFilter;
    const matchesZone = selectedZoneFilter === 'All' || t.zone === selectedZoneFilter;
    const matchesSearch = t.num.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.customer && t.customer.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesZone && matchesSearch;
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

      {/* ================= 1. CLEAN STATUS KPI STRIP ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FCA5A5', padding: '0.85rem 1.1rem', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(220,38,38,0.05)' }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: '#991B1B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Occupied Tables</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#991B1B', margin: '0.1rem 0 0 0' }}>{occupiedCount} Tables</div>
          </div>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#DC2626', flexShrink: 0 }} />
        </div>

        <div style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #86EFAC', padding: '0.85rem 1.1rem', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(22,163,74,0.05)' }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Available Tables</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#166534', margin: '0.1rem 0 0 0' }}>{availableCount} Tables</div>
          </div>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#16A34A', flexShrink: 0 }} />
        </div>

        <div style={{ backgroundColor: '#FEFCE8', border: '1.5px solid #FDE047', padding: '0.85rem 1.1rem', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(202,138,4,0.05)' }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: '#854D0E', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reserved Tables</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#854D0E', margin: '0.1rem 0 0 0' }}>{reservedCount} Tables</div>
          </div>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#CA8A04', flexShrink: 0 }} />
        </div>

        <div style={{ backgroundColor: '#F8FAFC', border: '1.5px solid #CBD5E1', padding: '0.85rem 1.1rem', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(100,116,139,0.05)' }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cleaning Status</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#334155', margin: '0.1rem 0 0 0' }}>{cleaningCount} Tables</div>
          </div>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#64748B', flexShrink: 0 }} />
        </div>
      </div>

      {/* ================= 2. UNIFIED SINGLE-LINE CONTROL TOOLBAR ================= */}
      <div 
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '0.85rem 1.25rem',
          border: '1px solid #E2E8F0',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Search Box */}
        <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 240px' }}>
          <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search table no, zone, or guest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem 0.55rem 2.3rem',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              fontSize: '0.86rem',
              outline: 'none',
              backgroundColor: '#FAF6EE',
              color: '#0F2A1D',
              fontWeight: 600
            }}
          />
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: '#F1F5F9', padding: '0.25rem', borderRadius: '10px', flexWrap: 'wrap' }}>
          {[
            { id: 'All', label: `All (${tables.length})` },
            { id: 'Occupied', label: `Occupied (${occupiedCount})` },
            { id: 'Available', label: `Available (${availableCount})` },
            { id: 'Reserved', label: `Reserved (${reservedCount})` },
            { id: 'Cleaning', label: `Cleaning (${cleaningCount})` }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatusFilter(st.id)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                backgroundColor: selectedStatusFilter === st.id ? '#1E4636' : 'transparent',
                color: selectedStatusFilter === st.id ? '#FFFFFF' : '#64748B',
                transition: 'all 0.15s ease'
              }}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Zone Dropdown */}
        <div style={{ flexShrink: 0 }}>
          <select
            value={selectedZoneFilter}
            onChange={(e) => setSelectedZoneFilter(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              fontSize: '0.84rem',
              fontWeight: 700,
              backgroundColor: '#FFFFFF',
              color: '#1E4636',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="All">All Dining Zones</option>
            <option value="Main Dining">Main Dining</option>
            <option value="Window Section">Window Section</option>
            <option value="Family Lounge">Family Lounge</option>
            <option value="Patio Outdoor">Patio Outdoor</option>
          </select>
        </div>
      </div>

      {/* Floor Plan Visual Grid (Strictly 3 Cards Per Row) */}
      <div className="admin-floor-plan-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1.25rem' }}>
        {filteredTables.map((tbl) => (
          <div key={tbl.num} className={`trendy-table-card is-status-${tbl.status.toLowerCase()}`}>
            
            {/* Header: Table Number Badge (Left) & Status Selector (Right) */}
            <div className="trendy-card-header">
              <div className="tbl-badge-circle">
                <Table2 size={16} />
                <span className="tbl-num-text">{tbl.num}</span>
              </div>

              {/* Clean Static Status Pill Badge (Dropdown Removed) */}
              <div className={`trendy-status-pill is-${tbl.status.toLowerCase()}`}>
                <span>{tbl.status === 'Available' ? '🟢' : tbl.status === 'Occupied' ? '🔴' : tbl.status === 'Reserved' ? '🟡' : tbl.status === 'Cleaning' ? '🧹' : '⚪'}</span>
                <span>{tbl.status}</span>
              </div>
            </div>

            {/* Card Content Body */}
            <div className="trendy-card-body">
              <div className="trendy-meta-pills">
                {tbl.zone && tbl.zone.trim() !== '' && (
                  <span className="meta-pill is-zone">
                    <span>📍 {tbl.zone}</span>
                  </span>
                )}

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

              {/* Cleaning State Timer Box */}
              {tbl.status === 'Cleaning' && (
                <div style={{
                  backgroundColor: '#FEF3C7',
                  borderRadius: '12px',
                  padding: '0.65rem 0.85rem',
                  border: '1px solid #FDE68A',
                  marginTop: '0.65rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                    <span>🧹 Cleaning & Sanitize</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 700, marginTop: '0.15rem', fontFamily: 'monospace' }}>
                    {tbl.cleaningUntil ? (
                      (() => {
                        const remMs = new Date(tbl.cleaningUntil).getTime() - Date.now();
                        if (remMs <= 0) return 'Cleaning completed';
                        const mins = Math.floor(remMs / 60000);
                        const secs = Math.floor((remMs % 60000) / 1000);
                        return `${mins}m ${secs}s remaining`;
                      })()
                    ) : '10:00 remaining'}
                  </div>
                </div>
              )}

              {/* Occupied Live Order Glass Ticket */}
              {tbl.status === 'Occupied' && (
                <div className="trendy-occupied-ticket">
                  <div className="ticket-header">
                    <span className="ticket-code">{tbl.orderId}</span>
                    <span className="ticket-timer"><Clock size={12} /> {tbl.elapsed}</span>
                  </div>
                  <div className="ticket-body">
                    <span className="ticket-guest-name">{tbl.customer && tbl.customer !== '-' ? tbl.customer : (tbl.guest && tbl.guest !== '-' ? tbl.guest : 'Guest Diner')}</span>
                    <span className="ticket-price-tag">{tbl.amount && tbl.amount !== '-' ? tbl.amount : '₹0'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Perfectly Aligned Action Bar: View QR Button + 3-Dots Hover Options */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.9rem' }}>
              {tbl.qrPlaced ? (
                <button 
                  className="trendy-btn-primary-full"
                  onClick={() => handleOpenQrModal(tbl)}
                  style={{ flex: 1 }}
                >
                  <Eye size={15} />
                  <span>View QR</span>
                </button>
              ) : (
                <button 
                  className="trendy-btn-primary-full"
                  disabled
                  title="No QR code placed on this table. Use the 3-dots menu to generate & place QR code."
                  style={{
                    flex: 1,
                    backgroundColor: '#E2E8F0',
                    color: '#94A3B8',
                    border: '1px solid #CBD5E1',
                    cursor: 'not-allowed',
                    boxShadow: 'none',
                    opacity: 0.75
                  }}
                >
                  <EyeOff size={15} />
                  <span>View QR</span>
                </button>
              )}

              {/* Three-Dots Action Menu (Hover to reveal Edit, Place QR & Delete options) */}
              <div className="table-card-more-menu-wrap">
                <button 
                  type="button"
                  className="table-card-dots-btn"
                  title="More Table Options"
                >
                  <MoreVertical size={18} color="#0F2A1D" />
                </button>
                <div className="table-card-dropdown-menu">
                  {tbl.qrPlaced ? (
                    <button 
                      type="button"
                      className="table-card-dropdown-item"
                      onClick={() => handleToggleBlockQr(tbl.id)}
                      disabled={tbl.status === 'Occupied'}
                      title={tbl.status === 'Occupied' ? '🔒 Cannot block QR while table is Occupied' : ''}
                      style={{ color: tbl.status === 'Occupied' ? '#94A3B8' : '#DC2626', fontWeight: 700, opacity: tbl.status === 'Occupied' ? 0.5 : 1, cursor: tbl.status === 'Occupied' ? 'not-allowed' : 'pointer' }}
                    >
                      <EyeOff size={14} color={tbl.status === 'Occupied' ? '#94A3B8' : '#DC2626'} />
                      <span>Block QR {tbl.status === 'Occupied' ? '🔒' : ''}</span>
                    </button>
                  ) : (
                    <button 
                      type="button"
                      className="table-card-dropdown-item"
                      onClick={() => handleToggleBlockQr(tbl.id)}
                      disabled={tbl.status === 'Occupied'}
                      title={tbl.status === 'Occupied' ? '🔒 Cannot place QR while table is Occupied' : ''}
                      style={{ color: tbl.status === 'Occupied' ? '#94A3B8' : '#166534', fontWeight: 700, opacity: tbl.status === 'Occupied' ? 0.5 : 1, cursor: tbl.status === 'Occupied' ? 'not-allowed' : 'pointer' }}
                    >
                      <QrCode size={14} color={tbl.status === 'Occupied' ? '#94A3B8' : '#166534'} />
                      <span>Place QR on Table {tbl.status === 'Occupied' ? '🔒' : ''}</span>
                    </button>
                  )}

                  <button 
                    type="button"
                    className="table-card-dropdown-item"
                    onClick={() => handleOpenEditModal(tbl)}
                    disabled={tbl.status === 'Occupied'}
                    title={tbl.status === 'Occupied' ? '🔒 Cannot edit table while table is Occupied' : ''}
                    style={{ opacity: tbl.status === 'Occupied' ? 0.5 : 1, cursor: tbl.status === 'Occupied' ? 'not-allowed' : 'pointer' }}
                  >
                    <Edit size={14} color={tbl.status === 'Occupied' ? '#94A3B8' : '#1E4636'} />
                    <span>Edit Table {tbl.status === 'Occupied' ? '🔒' : ''}</span>
                  </button>

                  <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '0.25rem 0' }} />

                  <button 
                    type="button"
                    className="table-card-dropdown-item is-danger"
                    onClick={() => handleDeleteTable(tbl.id, tbl.num)}
                    disabled={tbl.status === 'Occupied'}
                    title={tbl.status === 'Occupied' ? '🔒 Cannot delete table while table is Occupied' : ''}
                    style={{ opacity: tbl.status === 'Occupied' ? 0.5 : 1, cursor: tbl.status === 'Occupied' ? 'not-allowed' : 'pointer' }}
                  >
                    <Trash2 size={14} color={tbl.status === 'Occupied' ? '#94A3B8' : '#DC2626'} />
                    <span>Delete Table {tbl.status === 'Occupied' ? '🔒' : ''}</span>
                  </button>
                </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                    Dining Zone / Section <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>(Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsEditCustomZone(!isEditCustomZone)}
                    style={{ background: 'none', border: 'none', color: '#FF8A00', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {isEditCustomZone ? '← Select Existing Zone' : '➕ Create New Zone'}
                  </button>
                </div>

                {isEditCustomZone ? (
                  <input
                    type="text"
                    placeholder="Enter new zone e.g. Rooftop Patio, VIP Suite..."
                    value={editCustomZoneName}
                    onChange={(e) => setEditCustomZoneName(e.target.value)}
                    className="form-control"
                    autoFocus
                  />
                ) : (
                  <select
                    value={editingTable.zone || ''}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsEditCustomZone(true);
                      } else {
                        setEditingTable({ ...editingTable, zone: e.target.value });
                      }
                    }}
                    className="form-control"
                  >
                    <option value="">-- Select Dining Zone (Optional) --</option>
                    {Array.from(new Set(['Main Dining', 'Window Section', 'Family Lounge', 'Patio Outdoor', ...tables.map(t => t.zone).filter(Boolean)])).map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                    <option value="__NEW__">➕ Create New Custom Zone...</option>
                  </select>
                )}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                    Dining Zone / Section <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>(Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomZone(!isCustomZone)}
                    style={{ background: 'none', border: 'none', color: '#FF8A00', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {isCustomZone ? '← Select Existing Zone' : '➕ Create New Zone'}
                  </button>
                </div>

                {isCustomZone ? (
                  <input
                    type="text"
                    placeholder="Enter new zone e.g. Rooftop Patio, VIP Suite..."
                    value={customZoneName}
                    onChange={(e) => setCustomZoneName(e.target.value)}
                    className="form-control"
                    autoFocus
                  />
                ) : (
                  <select
                    value={newTableData.zone || ''}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsCustomZone(true);
                      } else {
                        setNewTableData({ ...newTableData, zone: e.target.value });
                      }
                    }}
                    className="form-control"
                  >
                    <option value="">-- Select Dining Zone (Optional) --</option>
                    {Array.from(new Set(['Main Dining', 'Window Section', 'Family Lounge', 'Patio Outdoor', ...tables.map(t => t.zone).filter(Boolean)])).map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                    <option value="__NEW__">➕ Create New Custom Zone...</option>
                  </select>
                )}
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
