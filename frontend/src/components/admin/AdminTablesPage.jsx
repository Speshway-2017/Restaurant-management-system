import React, { useState } from 'react';
import { Table2, Plus, QrCode, Eye, EyeOff, CheckCircle2, Users, Clock, RefreshCw, Search, X, Printer, Check, Sparkles, Link2, UploadCloud, Image as ImageIcon, Edit, Trash2, Clipboard, MoreVertical } from 'lucide-react';
import { api } from '../../services/api';
import { getTableMenuUrl } from '../../utils/qrUrlHelper';
import { useRestaurantBranding } from '../../context/RestaurantBrandingContext';

export default function AdminTablesPage() {
  const { brandName } = useRestaurantBranding ? useRestaurantBranding() : { brandName: 'Flavora Kitchen' };
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQrTable, setSelectedQrTable] = useState(null);
  const [qrModalTab, setQrModalTab] = useState('generated'); // 'generated' or 'custom'
  const [customQrUrlInput, setCustomQrUrlInput] = useState('');
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  // Add & Edit Table Modals
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
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
    const isQrPlaced = tbl.qrPlaced !== undefined ? Boolean(tbl.qrPlaced) : true;
    if (isMockCustomer || isMockOrder) {
      return {
        ...tbl,
        status: 'Available',
        customer: '-',
        orderId: null,
        amount: '-',
        elapsed: '-',
        qrPlaced: isQrPlaced
      };
    }
    return {
      ...tbl,
      qrPlaced: isQrPlaced
    };
  };

  const syncTableOrdersWithLocalStorage = (rawTables) => {
    if (!Array.isArray(rawTables)) return defaultTables;
    return rawTables.map(tbl => {
      const sanitized = sanitizeTableItem(tbl);
      try {
        const numDigits = String(sanitized.num || '').replace(/[^0-9]/g, '');
        const savedOrderStr = localStorage.getItem(`flavora_table_orders_${sanitized.num}`) ||
          (numDigits ? localStorage.getItem(`flavora_table_orders_${numDigits}`) : null) ||
          (numDigits ? localStorage.getItem(`flavora_table_orders_T-${numDigits.padStart(2, '0')}`) : null);

        if (savedOrderStr) {
          const orderItems = JSON.parse(savedOrderStr);
          if (Array.isArray(orderItems) && orderItems.length > 0) {
            const activeItems = orderItems.filter(i => i && i.status !== 'Completed' && i.status !== 'Cancelled');
            if (activeItems.length > 0) {
              const totalAmt = activeItems.reduce((acc, i) => acc + ((i.price || 0) * (i.qty || 1)), 0);
              return {
                ...sanitized,
                status: 'Occupied',
                amount: `₹${totalAmt}`,
                customer: sanitized.customer && sanitized.customer !== '-' ? sanitized.customer : 'Guest',
                orderId: sanitized.orderId || 'Active Order'
              };
            }
          }
        }
      } catch (e) { }
      return sanitized;
    });
  };

  const [tablesList, setTablesList] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_tables');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return syncTableOrdersWithLocalStorage(parsed);
        }
      }
    } catch (e) { }
    return defaultTables;
  });

  const [newNum, setNewNum] = useState('');
  const [newZone, setNewZone] = useState('Main Dining');
  const [isCustomZone, setIsCustomZone] = useState(false);
  const [customZoneName, setCustomZoneName] = useState('');
  const [newCap, setNewCap] = useState(4);
  const [newStatus, setNewStatus] = useState('Available');

  const [editNum, setEditNum] = useState('');
  const [editZone, setEditZone] = useState('Main Dining');
  const [isEditCustomZone, setIsEditCustomZone] = useState(false);
  const [editCustomZoneName, setEditCustomZoneName] = useState('');
  const [editCap, setEditCap] = useState(4);
  const [editStatus, setEditStatus] = useState('Available');
  const [editQrPlaced, setEditQrPlaced] = useState(true);

  React.useEffect(() => {
    const handleTablesSync = () => {
      try {
        const saved = localStorage.getItem('flavora_tables');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const now = Date.now();
            let changed = false;
            const checkedTables = parsed.map(t => {
              if (t.status === 'Cleaning' && t.cleaningUntil && now >= t.cleaningUntil) {
                changed = true;
                return { ...t, status: 'Available', cleaningUntil: null, guest: '-', customer: '-', orderId: null, amount: '-' };
              }
              return t;
            });
            setTablesList(syncTableOrdersWithLocalStorage(checkedTables));
            if (changed) {
              localStorage.setItem('flavora_tables', JSON.stringify(checkedTables));
            }
          }
        }
      } catch (e) { }
    };
    handleTablesSync();
    const interval = setInterval(handleTablesSync, 1000);
    window.addEventListener('flavora_tables_updated', handleTablesSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('flavora_tables_updated', handleTablesSync);
    };
  }, []);

  const saveTablesToStorage = (updatedList) => {
    setTablesList(updatedList);
    try {
      localStorage.setItem('flavora_tables', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('flavora_tables_updated'));
    } catch (e) { }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const dynamicZonesList = React.useMemo(() => {
    const defaultZones = ['Main Dining', 'Window Section', 'Family Lounge', 'Patio Outdoor'];
    const customZones = tablesList.map(t => t.zone).filter(z => z && !defaultZones.includes(z));
    return ['All', ...defaultZones, ...Array.from(new Set(customZones))];
  }, [tablesList]);

  const filteredTables = tablesList.filter((tbl) => {
    const matchesStatus = selectedStatusFilter === 'All' || tbl.status === selectedStatusFilter;
    const matchesZone = selectedZoneFilter === 'All' || tbl.zone === selectedZoneFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (tbl.num || '').toLowerCase().includes(q) || (tbl.zone || '').toLowerCase().includes(q) || (tbl.customer || '').toLowerCase().includes(q);
    return matchesStatus && matchesZone && matchesSearch;
  });

  const activeTablesCount = tablesList.filter(t => t.status === 'Occupied').length;
  const totalSeatsCount = tablesList.reduce((acc, t) => acc + (Number(t.cap) || 0), 0);

  const handleOpenQrModal = (tbl) => {
    setSelectedQrTable(tbl);
    setQrModalTab('generated');
    setCustomQrUrlInput(tbl.customQrUrl || '');
  };

  const handleToggleBlockQr = (tblId) => {
    const target = tablesList.find(t => t.id === tblId);
    if (!target) return;
    const isNowBlocked = target.qrPlaced;
    const updated = tablesList.map(t => t.id === tblId ? { ...t, qrPlaced: !isNowBlocked } : t);
    saveTablesToStorage(updated);
    if (isNowBlocked) {
      showToast(`🚫 QR Code blocked & deactivated for ${target.num}!`);
    } else {
      showToast(`🟢 QR Code activated & placed on ${target.num}!`);
    }
  };

  const handlePlaceQrOnTable = (tblId) => {
    handleToggleBlockQr(tblId);
  };

  const getTableQrRedirectUrl = (tbl) => {
    if (!tbl) return getTableMenuUrl('T-01');
    if (tbl.customQrUrl && tbl.customQrUrl.trim() !== '') return tbl.customQrUrl;
    return getTableMenuUrl(tbl.num || 'T-01');
  };

  // Print Single Table Standee
  const handlePrintSingleQr = (tbl) => {
    const targetTable = tbl || selectedQrTable;
    if (!targetTable) return;
    const targetLink = getTableMenuUrl(targetTable.num);
    const qrSrc = targetTable.customQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=H&data=${encodeURIComponent(targetLink)}`;

    const restName = brandName || 'Flavora Kitchen';
    const printWindow = window.open('', '_blank', 'width=750,height=900');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Standee - Table ${targetTable.num}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #f8fafc;
              padding: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .standee-card {
              width: 360px;
              background: #ffffff;
              border: 3.5px solid #0F2A1D;
              border-radius: 28px;
              padding: 32px 24px;
              text-align: center;
              box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            }
            .brand-title {
              font-size: 22px;
              font-weight: 900;
              color: #0F2A1D;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              margin-bottom: 2px;
            }
            .brand-subtitle {
              font-size: 11px;
              font-weight: 700;
              color: #166534;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              margin-bottom: 14px;
            }
            .table-badge {
              display: inline-block;
              background: #0F2A1D;
              color: #ffffff;
              font-size: 26px;
              font-weight: 900;
              padding: 6px 24px;
              border-radius: 9999px;
              letter-spacing: 1px;
            }
            .zone-label {
              font-size: 12px;
              color: #64748B;
              font-weight: 700;
              margin-top: 6px;
              margin-bottom: 16px;
            }
            .qr-box {
              width: 220px;
              height: 220px;
              margin: 0 auto 16px;
              border: 2px dashed #0F2A1D;
              border-radius: 20px;
              padding: 10px;
              background: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-code-img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .action-heading {
              font-size: 16px;
              font-weight: 900;
              color: #0F2A1D;
              letter-spacing: 0.05em;
              margin-bottom: 6px;
            }
            .action-sub {
              font-size: 12px;
              color: #475569;
              line-height: 1.45;
              margin-bottom: 16px;
              padding: 0 10px;
            }
            .standee-footer {
              border-top: 1.5px dashed #CBD5E1;
              padding-top: 12px;
              font-size: 11px;
              font-weight: 700;
              color: #166534;
              display: flex;
              justify-content: center;
              gap: 8px;
            }
            @media print {
              body {
                background: none;
                padding: 0;
              }
              .standee-card {
                box-shadow: none;
                border: 3px solid #0F2A1D;
                margin: 0 auto;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="standee-card">
            <div class="brand-title">${restName}</div>
            <div class="brand-subtitle">Smart Contactless Dining</div>
            
            <div class="table-badge">${targetTable.num}</div>
            <div class="zone-label">${targetTable.zone || 'Main Dining'} Zone</div>

            <div class="qr-box">
              <img class="qr-code-img" src="${qrSrc}" alt="QR Code ${targetTable.num}" />
            </div>

            <div class="action-heading">SCAN TO ORDER &amp; PAY</div>
            <div class="action-sub">Open phone camera or Google Pay / PhonePe / Paytm to view digital menu &amp; place orders</div>

            <div class="standee-footer">
              <span>⚡ Fast Kitchen Dispatch</span>
              <span>•</span>
              <span>🔒 100% Secure Checkout</span>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Print All Table Standees
  const handlePrintAllQrs = () => {
    if (!Array.isArray(tablesList) || tablesList.length === 0) return;
    const restName = brandName || 'Flavora Kitchen';
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) {
      window.print();
      return;
    }

    const cardsHtml = tablesList.map(tbl => {
      const targetLink = getTableMenuUrl(tbl.num);
      const qrSrc = tbl.customQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=360x360&ecc=H&data=${encodeURIComponent(targetLink)}`;
      return `
        <div class="standee-wrapper">
          <div class="standee-card">
            <div class="brand-title">${restName}</div>
            <div class="brand-subtitle">Smart Contactless Dining</div>
            
            <div class="table-badge">${tbl.num}</div>
            <div class="zone-label">${tbl.zone || 'Main Dining'} Zone</div>

            <div class="qr-box">
              <img class="qr-code-img" src="${qrSrc}" alt="QR Code ${tbl.num}" />
            </div>

            <div class="action-heading">SCAN TO ORDER &amp; PAY</div>
            <div class="action-sub">Scan with camera or UPI app to order &amp; pay</div>

            <div class="standee-footer">
              <span>⚡ Fast Dispatch</span>
              <span>•</span>
              <span>🔒 Contactless</span>
            </div>
          </div>
        </div>
      `;
    }).join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print All Table QR Standees</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #f8fafc;
              padding: 15px;
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
              justify-content: center;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .standee-wrapper {
              page-break-inside: avoid;
            }
            .standee-card {
              width: 320px;
              background: #ffffff;
              border: 3px solid #0F2A1D;
              border-radius: 24px;
              padding: 24px 18px;
              text-align: center;
              box-shadow: 0 4px 16px rgba(0,0,0,0.06);
            }
            .brand-title {
              font-size: 19px;
              font-weight: 900;
              color: #0F2A1D;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }
            .brand-subtitle {
              font-size: 11px;
              font-weight: 700;
              color: #166534;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              margin-bottom: 10px;
            }
            .table-badge {
              display: inline-block;
              background: #0F2A1D;
              color: #ffffff;
              font-size: 24px;
              font-weight: 900;
              padding: 5px 18px;
              border-radius: 9999px;
              letter-spacing: 1px;
            }
            .zone-label {
              font-size: 11px;
              color: #64748B;
              font-weight: 700;
              margin-top: 4px;
              margin-bottom: 12px;
            }
            .qr-box {
              width: 190px;
              height: 190px;
              margin: 0 auto 12px;
              border: 2px dashed #0F2A1D;
              border-radius: 16px;
              padding: 6px;
              background: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-code-img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .action-heading {
              font-size: 14px;
              font-weight: 900;
              color: #0F2A1D;
              letter-spacing: 0.05em;
              margin-bottom: 4px;
            }
            .action-sub {
              font-size: 11px;
              color: #475569;
              line-height: 1.35;
              margin-bottom: 12px;
              padding: 0 6px;
            }
            .standee-footer {
              border-top: 1.5px dashed #CBD5E1;
              padding-top: 8px;
              font-size: 10px;
              font-weight: 700;
              color: #166534;
              display: flex;
              justify-content: center;
              gap: 8px;
            }
            @media print {
              body {
                background: none;
                padding: 0;
              }
              .standee-card {
                box-shadow: none;
                border: 2.5px solid #0F2A1D;
              }
            }
          </style>
        </head>
        <body>
          ${cardsHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleAddTableSubmit = (e) => {
    e.preventDefault();
    const finalZone = isCustomZone ? customZoneName.trim() : (newZone ? newZone.trim() : '');
    const tableNumStr = newNum.trim() || `T-${String(tablesList.length + 1).padStart(2, '0')}`;

    const newTableObj = {
      id: Date.now(),
      num: tableNumStr,
      zone: finalZone,
      cap: Number(newCap) || 4,
      status: newStatus,
      orderId: null,
      amount: '-',
      elapsed: '-',
      customer: '-',
      qrPlaced: true,
      customQrUrl: ''
    };

    saveTablesToStorage([...tablesList, newTableObj]);
    setIsAddTableModalOpen(false);
    setNewNum('');
    setIsCustomZone(false);
    setCustomZoneName('');
    showToast(`🎉 Table ${tableNumStr} created successfully in ${finalZone}!`);
  };

  const handleOpenEditModal = (tbl) => {
    setEditingTable(tbl);
    setEditNum(tbl.num);
    const isStandardZone = ['Main Dining', 'Window Section', 'Family Lounge', 'Patio Outdoor'].includes(tbl.zone);
    if (isStandardZone) {
      setEditZone(tbl.zone);
      setIsEditCustomZone(false);
      setEditCustomZoneName('');
    } else {
      setEditZone('Main Dining');
      setIsEditCustomZone(true);
      setEditCustomZoneName(tbl.zone);
    }
    setEditCap(tbl.cap);
    setEditStatus(tbl.status);
    setEditQrPlaced(tbl.qrPlaced !== false);
  };

  const handleEditTableSubmit = (e) => {
    e.preventDefault();
    if (!editingTable) return;
    const finalZone = isEditCustomZone ? (editCustomZoneName.trim() || 'Main Dining') : (editZone || 'Main Dining');

    const updated = tablesList.map(t => {
      if (t.id === editingTable.id) {
        return {
          ...t,
          num: editNum.trim() || t.num,
          zone: finalZone,
          cap: Number(editCap) || 4,
          status: editStatus,
          qrPlaced: editQrPlaced
        };
      }
      return t;
    });

    saveTablesToStorage(updated);
    setEditingTable(null);
    showToast(`✓ Table ${editNum} details updated!`);
  };

  const handleDeleteTable = (tblId, tblNum) => {
    if (window.confirm(`Are you sure you want to delete ${tblNum}?`)) {
      const updated = tablesList.filter(t => t.id !== tblId);
      saveTablesToStorage(updated);
      showToast(`🗑️ Table ${tblNum} deleted.`);
    }
  };

  return (
    <div className="admin-subpage-container" style={{ paddingBottom: '3rem' }}>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#1E4636',
          color: '#FFFFFF',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          zIndex: 99999,
          fontWeight: 700,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Dashboard Page Header */}
      <div className="admin-dashboard-header">
        <div>
          <div className="page-breadcrumb-bar">
            <span>Admin Portal</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Tables & Floor Layout</span>
          </div>
          <h1 className="admin-page-title">Dining Tables & QR Management</h1>
          <p className="admin-page-subtitle">Configure table seating, floor layout zones, and active customer order QR codes.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handlePrintAllQrs}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', borderColor: '#CBD5E1', color: '#0F2A1D', fontWeight: 700 }}
            title="Print standees for all tables at once"
          >
            <Printer size={16} />
            <span>Print All QRs</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAddTableModalOpen(true)}
            style={{ backgroundColor: '#1E4636', borderColor: '#1E4636' }}
          >
            <Plus size={16} />
            <span>Add New Table</span>
          </button>
        </div>
      </div>

      {/* Floor Overview Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.75rem'
      }}>
        <div className="analytics-kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>TOTAL TABLES</span>
            <Table2 size={20} color="#1E4636" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F2A1D', marginTop: '0.3rem' }}>{tablesList.length}</div>
        </div>

        <div className="analytics-kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>ACTIVE OCCUPIED</span>
            <Users size={20} color="#EAB308" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#EAB308', marginTop: '0.3rem' }}>{activeTablesCount}</div>
        </div>

        <div className="analytics-kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>TOTAL SEATING CAPACITY</span>
            <CheckCircle2 size={20} color="#22C55E" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#22C55E', marginTop: '0.3rem' }}>{totalSeatsCount} Guests</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        border: '1px solid #F0EAE1',
        marginBottom: '1.75rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Left: Zone Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B', marginRight: '0.4rem' }}>ZONE:</span>
          {dynamicZonesList.map(zone => (
            <button
              key={zone}
              type="button"
              onClick={() => setSelectedZoneFilter(zone)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: selectedZoneFilter === zone ? '#1E4636' : '#F1F5F9',
                color: selectedZoneFilter === zone ? '#FFFFFF' : '#475569',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {zone}
            </button>
          ))}
        </div>

        {/* Right: Search Box */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search table, zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '2.4rem',
              paddingRight: '1rem',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Grid of Tables */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
        gap: '1.25rem'
      }}>
        {filteredTables.map(tbl => {
          const isOccupied = tbl.status === 'Occupied';
          const isReserved = tbl.status === 'Reserved';

          return (
            <div
              key={tbl.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                padding: '1.25rem',
                border: isOccupied ? '2px solid #EAB308' : isReserved ? '2px solid #3B82F6' : '1px solid #F0EAE1',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div>
                {/* Table Header: Num & Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F2A1D', backgroundColor: '#F8F6F0', padding: '0.3rem 0.75rem', borderRadius: '10px', border: '1px solid #EAE3D2' }}>
                      {tbl.num}
                    </span>
                  </div>

                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    backgroundColor: isOccupied ? '#FFE4E6' : isReserved ? '#DBEAFE' : tbl.status === 'Cleaning' ? '#FEF9C3' : '#DCFCE7',
                    color: isOccupied ? '#9F1239' : isReserved ? '#1E40AF' : tbl.status === 'Cleaning' ? '#854D0E' : '#166534',
                    border: `1px solid ${isOccupied ? '#FDA4AF' : isReserved ? '#BFDBFE' : tbl.status === 'Cleaning' ? '#FDE047' : '#BBF7D0'}`
                  }}>
                    {isOccupied ? '🔴 Occupied' : isReserved ? '🔵 Reserved' : tbl.status === 'Cleaning' ? '🧹 Cleaning' : '🟢 Available'}
                  </span>
                </div>

                {/* Table Details: Zone, Capacity, QR Badge */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, backgroundColor: '#FFF5ED', color: '#92400E', padding: '0.2rem 0.55rem', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                    📍 {tbl.zone}
                  </span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, backgroundColor: '#F1F5F9', color: '#475569', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                    👥 {tbl.cap} Seats
                  </span>
                  {tbl.qrPlaced ? (
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, backgroundColor: '#ECFDF5', color: '#047857', padding: '0.2rem 0.55rem', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
                      ✓ QR Active
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, backgroundColor: '#FEF2F2', color: '#DC2626', padding: '0.2rem 0.55rem', borderRadius: '6px', border: '1px solid #FCA5A5' }}>
                      ⚠️ No QR
                    </span>
                  )}
                </div>

                {/* Active Order Box (If Occupied) */}
                {isOccupied && (
                  <div style={{ backgroundColor: '#FEFCE8', borderRadius: '12px', padding: '0.75rem', border: '1px dashed #FDE047', marginBottom: '0.85rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#854D0E' }}>
                      Guest: {tbl.customer || 'Customer'}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0F2A1D', marginTop: '0.2rem' }}>
                      Bill Amount: {tbl.amount || '₹0'}
                    </div>
                  </div>
                )}

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
              </div>

              {/* Action Bar: View QR Button + 3-Dots Hover Options */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.9rem' }}>
                {tbl.qrPlaced ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleOpenQrModal(tbl)}
                    style={{ flex: 1, backgroundColor: '#1E4636', borderColor: '#1E4636', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800 }}
                  >
                    <Eye size={15} />
                    <span>View QR</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled
                    title="No QR code placed on this table. Use the 3-dots menu to generate & place QR code."
                    style={{
                      flex: 1,
                      backgroundColor: '#E2E8F0',
                      color: '#94A3B8',
                      border: '1px solid #CBD5E1',
                      cursor: 'not-allowed',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      boxShadow: 'none',
                      opacity: 0.75
                    }}
                  >
                    <EyeOff size={15} />
                    <span>View QR</span>
                  </button>
                )}

                {/* Three-Dots Action Menu */}
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
                        style={{ color: '#DC2626', fontWeight: 700 }}
                      >
                        <EyeOff size={14} color="#DC2626" />
                        <span>Block QR</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="table-card-dropdown-item"
                        onClick={() => handleToggleBlockQr(tbl.id)}
                        style={{ color: '#166534', fontWeight: 700 }}
                      >
                        <QrCode size={14} color="#166534" />
                        <span>Place QR on Table</span>
                      </button>
                    )}

                      <button
                        type="button"
                        className="table-card-dropdown-item"
                        onClick={() => handlePrintSingleQr(tbl)}
                        style={{ color: '#166534', fontWeight: 700 }}
                      >
                        <Printer size={14} color="#166534" />
                        <span>Print QR Standee</span>
                      </button>

                      <button
                        type="button"
                        className="table-card-dropdown-item"
                        onClick={() => handleOpenEditModal(tbl)}
                      >
                        <Edit size={14} color="#1E4636" />
                        <span>Edit Table</span>
                      </button>

                    <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '0.25rem 0' }} />

                    <button
                      type="button"
                      className="table-card-dropdown-item is-danger"
                      onClick={() => handleDeleteTable(tbl.id, tbl.num)}
                    >
                      <Trash2 size={14} color="#DC2626" />
                      <span>Delete Table</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ================= ADD NEW TABLE MODAL ================= */}
      {isAddTableModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsAddTableModalOpen(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="admin-modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F2A1D' }}>Add New Dining Table</h3>
              <button type="button" className="admin-modal-close" onClick={() => setIsAddTableModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTableSubmit} style={{ padding: '1.25rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="admin-form-label">Table Number / Label</label>
                <input
                  type="text"
                  placeholder="e.g. T-13 or Rooftop-01"
                  value={newNum}
                  onChange={(e) => setNewNum(e.target.value)}
                  className="admin-form-input"
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="admin-form-label">Dining Zone</label>
                {!isCustomZone ? (
                  <select
                    value={newZone || ''}
                    onChange={(e) => {
                      if (e.target.value === 'CREATE_NEW_ZONE') {
                        setIsCustomZone(true);
                      } else {
                        setNewZone(e.target.value);
                      }
                    }}
                    className="admin-form-input"
                  >
                    <option value="">-- Select Dining Zone (Optional) --</option>
                    <option value="Main Dining">Main Dining</option>
                    <option value="Window Section">Window Section</option>
                    <option value="Family Lounge">Family Lounge</option>
                    <option value="Patio Outdoor">Patio Outdoor</option>
                    <option value="CREATE_NEW_ZONE">➕ Create New Zone...</option>
                  </select>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Type custom zone (e.g. Rooftop Terrace)..."
                      value={customZoneName}
                      onChange={(e) => setCustomZoneName(e.target.value)}
                      className="admin-form-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomZone(false)}
                      style={{ padding: '0 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#F1F5F9', fontWeight: 700, fontSize: '0.8rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="admin-form-label">Seating Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={newCap}
                  onChange={(e) => setNewCap(e.target.value)}
                  className="admin-form-input"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsAddTableModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#1E4636', borderColor: '#1E4636' }}>
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT TABLE MODAL ================= */}
      {editingTable && (
        <div className="admin-modal-backdrop" onClick={() => setEditingTable(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="admin-modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F2A1D' }}>Edit Table {editingTable.num}</h3>
              <button type="button" className="admin-modal-close" onClick={() => setEditingTable(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditTableSubmit} style={{ padding: '1.25rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="admin-form-label">Table Number / Label</label>
                <input
                  type="text"
                  value={editNum}
                  onChange={(e) => setEditNum(e.target.value)}
                  className="admin-form-input"
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="admin-form-label">Dining Zone</label>
                {!isEditCustomZone ? (
                  <select
                    value={editZone}
                    onChange={(e) => {
                      if (e.target.value === 'CREATE_NEW_ZONE') {
                        setIsEditCustomZone(true);
                      } else {
                        setEditZone(e.target.value);
                      }
                    }}
                    className="admin-form-input"
                  >
                    <option value="Main Dining">Main Dining</option>
                    <option value="Window Section">Window Section</option>
                    <option value="Family Lounge">Family Lounge</option>
                    <option value="Patio Outdoor">Patio Outdoor</option>
                    <option value="CREATE_NEW_ZONE">➕ Create Custom Zone...</option>
                  </select>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Type custom zone..."
                      value={editCustomZoneName}
                      onChange={(e) => setEditCustomZoneName(e.target.value)}
                      className="admin-form-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditCustomZone(false)}
                      style={{ padding: '0 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#F1F5F9', fontWeight: 700, fontSize: '0.8rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="admin-form-label">Seating Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={editCap}
                  onChange={(e) => setEditCap(e.target.value)}
                  className="admin-form-input"
                  required
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="admin-form-label">Table Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="admin-form-input"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Reserved">Reserved</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingTable(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#1E4636', borderColor: '#1E4636' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW / DOWNLOAD / PRINT QR CODE MODAL ================= */}
      {selectedQrTable && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedQrTable(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={20} color="#1E4636" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F2A1D' }}>
                  Table {selectedQrTable.num} Ordering QR Code
                </h3>
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setSelectedQrTable(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '2px solid #1E4636', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', marginBottom: '1.25rem', position: 'relative' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&ecc=H&data=${encodeURIComponent(getTableQrRedirectUrl(selectedQrTable))}`}
                  alt={`QR Code for ${selectedQrTable.num}`}
                  style={{ width: '220px', height: '220px', display: 'block' }}
                />
                {/* Brand Logo in Middle of QR */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '52px',
                    height: '52px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '50%',
                    border: '2px solid #1E4636',
                    boxShadow: '0 2px 8px rgba(30, 70, 54, 0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    pointerEvents: 'none'
                  }}
                >
                  <img
                    src="/qr-logo.png"
                    alt="Flavora Emblem"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => { e.target.src = '/logo.png'; }}
                  />
                </div>
              </div>

              <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '0 0 1.25rem 0' }}>
                Guests at <strong>{selectedQrTable.num} ({selectedQrTable.zone})</strong> can scan this QR code on their smartphone to view menu & place orders directly.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handlePrintSingleQr(selectedQrTable)}
                  style={{ backgroundColor: '#166534', borderColor: '#166534', display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800 }}
                >
                  <Printer size={16} />
                  <span>Print Standee</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    navigator.clipboard.writeText(getTableQrRedirectUrl(selectedQrTable));
                    showToast(`✓ Table ${selectedQrTable.num} order link copied!`);
                  }}
                >
                  <Clipboard size={16} />
                  <span>Copy Ordering Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
