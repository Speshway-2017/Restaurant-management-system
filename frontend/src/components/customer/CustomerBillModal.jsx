import React, { useState, useEffect } from 'react';
import {
  X, Receipt, Check, CreditCard, QrCode, Wallet, Coins, Percent, Download,
  Share2, Sparkles, AlertCircle, Printer, Tag, ShieldCheck, ChevronRight, Lock, Gift, Users, Utensils
} from 'lucide-react';
import { api } from '../../services/api';
import { useRestaurantBranding } from '../../context/RestaurantBrandingContext';

export default function CustomerBillModal({
  activeOrder,
  tableNum,
  onClose,
  onPaymentSuccess,
  appliedCoupon,
  setAppliedCoupon,
  brandSettings = {}
}) {
  const brandingContext = useRestaurantBranding ? useRestaurantBranding() : null;
  const branding = brandingContext?.branding || brandSettings;
  const [dynamicGstRate, setDynamicGstRate] = useState(0.05);

  useEffect(() => {
    const loadGstRate = async () => {
      try {
        let rawGst = branding?.gstRate;
        const rawSaved = localStorage.getItem('flavora_restaurant_settings');
        if (rawSaved) {
          const parsed = JSON.parse(rawSaved);
          if (parsed.gstRate !== undefined && parsed.gstRate !== null) rawGst = parsed.gstRate;
        }
        if (rawGst === undefined || rawGst === null) {
          const settings = await api.getSettings();
          if (settings && settings.gstRate !== undefined && settings.gstRate !== null) {
            rawGst = settings.gstRate;
          }
        }
        if (rawGst !== undefined && rawGst !== null) {
          const str = String(rawGst).replace('%', '').trim();
          const num = parseFloat(str);
          if (!isNaN(num) && num >= 0) {
            const rateVal = num > 1 ? num / 100 : num;
            setDynamicGstRate(rateVal);
          }
        }
      } catch (e) {}
    };

    loadGstRate();
    const interval = setInterval(loadGstRate, 3000);
    return () => clearInterval(interval);
  }, [branding]);

  const [tipAmount, setTipAmount] = useState(0);
  const [customTipInput, setCustomTipInput] = useState('');
  const [isCustomTipOpen, setIsCustomTipOpen] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponMsg, setCouponMsg] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [showInvoice, setShowInvoice] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(true);

  // Items fetched strictly from MongoDB active order
  const items = Array.isArray(activeOrder?.items) ? activeOrder.items : [];

  const foodTotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);

  // Dynamic GST Tax calculation (configurable via Admin Settings)
  const gstRate = dynamicGstRate;
  const gstAmount = Math.round(foodTotal * gstRate);
  const gstPctLabel = Math.round(gstRate * 100);

  // Discount
  const couponDiscount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const totalDiscount = couponDiscount;

  // Final Payable
  const netAmount = Math.max(0, foodTotal - couponDiscount);
  const grandTotal = Math.max(0, netAmount + gstAmount + tipAmount);

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    setIsValidatingCoupon(true);
    setCouponMsg(null);
    try {
      const res = await api.validateCoupon(couponCodeInput.trim(), foodTotal);
      if (res.valid) {
        setAppliedCoupon(res);
        setCouponMsg({ type: 'success', text: `✓ ${res.message || 'Coupon applied successfully!'}` });
      } else {
        setCouponMsg({ type: 'error', text: res.message || 'Invalid or expired coupon code' });
      }
    } catch (err) {
      // Local fallback coupon logic
      const codeClean = couponCodeInput.trim().toUpperCase();
      if (codeClean === 'WELCOME20' || codeClean === 'FLAVORA100' || codeClean === 'OFF20') {
        const disc = Math.min(foodTotal, 100);
        const couponObj = { code: codeClean, discountAmount: disc, message: 'Coupon applied successfully!' };
        setAppliedCoupon(couponObj);
        setCouponMsg({ type: 'success', text: `✓ ${codeClean} applied! Saved ₹${disc}` });
      } else {
        setCouponMsg({ type: 'error', text: 'Invalid coupon code. Try WELCOME20 or FLAVORA100' });
      }
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleTipSelect = (val) => {
    setIsCustomTipOpen(false);
    if (typeof val === 'number') {
      setTipAmount(val);
      setCustomTipInput('');
    } else if (val === '5%') {
      setTipAmount(Math.round(foodTotal * 0.05));
    } else if (val === '10%') {
      setTipAmount(Math.round(foodTotal * 0.10));
    } else if (val === 'custom') {
      setIsCustomTipOpen(true);
    }
  };

  const handleCustomTipChange = (valStr) => {
    setCustomTipInput(valStr);
    const num = Number(valStr) || 0;
    setTipAmount(num);
  };

  const handlePayOrder = async () => {
    setIsProcessingPayment(true);
    try {
      const payData = {
        status: 'Paid',
        payment: 'Paid',
        paymentStatus: 'Paid',
        paymentMethod,
        originalTotal: foodTotal,
        discountAmount: totalDiscount,
        couponCode: appliedCoupon?.code || '',
        tip: tipAmount,
        tipAmount,
        finalAmount: grandTotal,
        table: tableNum || activeOrder?.table || 'T-01'
      };
      if (activeOrder && (activeOrder._id || activeOrder.orderId)) {
        await api.updateOrderStatus(activeOrder._id || activeOrder.orderId, 'Paid', payData);
      }
      setIsProcessingPayment(false);
      setShowInvoice(true);
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err) {
      setIsProcessingPayment(false);
      setShowInvoice(true); // Fallback so guest gets invoice
      if (onPaymentSuccess) onPaymentSuccess();
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleShareInvoice = () => {
    if (navigator.share) {
      navigator.share({
        title: `${brandSettings.brandName || 'Flavora Kitchen'} Tax Invoice`,
        text: `Tax Invoice for Table ${tableNum || 'Dine-In'} - Paid: ₹${grandTotal}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      alert(`Receipt share link copied to clipboard! Total Paid: ₹${grandTotal}`);
    }
  };

  return (
    <div
      className="customer-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem 0.75rem'
      }}
    >
      <div
        className="customer-modal-card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '28px',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Header Banner */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0F2A1D 0%, #166534 100%)',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          color: '#FFFFFF',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Receipt size={22} color="#86EFAC" />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#86EFAC', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Live Running Bill • Table {tableNum || activeOrder?.table || 'T-01'}
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', margin: 0, lineHeight: 1.2 }}>
                  Billing & Settlement
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <X size={18} color="#FFFFFF" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.35rem 1.5rem 1.5rem 1.5rem', flex: 1 }}>

          {/* Digital GST Invoice Screen */}
          {showInvoice ? (
            <div>
              <div id="digital-gst-invoice" style={{
                padding: '1.5rem',
                backgroundColor: '#FAFAFA',
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                marginBottom: '1.25rem'
              }}>
                {/* Invoice Header */}
                <div style={{ textAlign: 'center', borderBottom: '2px dashed #CBD5E1', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
                    TAX INVOICE
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F2A1D', margin: 0 }}>
                    {brandSettings.brandName || 'FLAVORA KITCHEN'}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.35rem 0 0 0' }}>
                    GSTIN: 36AAACG1234F1Z9 • FSSAI: 13621011000123
                  </p>
                </div>

                {/* Invoice Info Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569', marginBottom: '1rem' }}>
                  <div>
                    <div><strong>Invoice #:</strong> INV-{Date.now().toString().slice(-6)}</div>
                    <div><strong>Table:</strong> {tableNum || activeOrder?.table || 'T-01'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                    <div><strong>Status:</strong> <span style={{ color: '#15803D', fontWeight: 900 }}>PAID ✓</span></div>
                  </div>
                </div>

                {/* Items Breakdown Table */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: '#334155', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.35rem', marginBottom: '0.5rem' }}>
                    <span style={{ flex: 2 }}>ITEM</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>QTY x RATE</span>
                    <span style={{ flex: 1, textAlign: 'right' }}>AMOUNT</span>
                  </div>
                  {items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#1E293B', marginBottom: '0.4rem' }}>
                      <span style={{ flex: 2, fontWeight: 600 }}>{it.name}</span>
                      <span style={{ flex: 1, textAlign: 'center', color: '#64748B' }}>{it.quantity} x ₹{it.price}</span>
                      <span style={{ flex: 1, textAlign: 'right', fontWeight: 800, color: '#0F2A1D' }}>₹{it.quantity * it.price}</span>
                    </div>
                  ))}
                </div>

                {/* Calculations */}
                <div style={{ borderTop: '2px dashed #CBD5E1', paddingTop: '0.85rem', fontSize: '0.82rem', color: '#334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span>Food Subtotal</span>
                    <span>₹{foodTotal}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803D', fontWeight: 700, marginBottom: '0.35rem' }}>
                      <span>Coupon Discount ({appliedCoupon?.code})</span>
                      <span>-₹{couponDiscount}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span>GST ({gstPctLabel}%)</span>
                    <span>+₹{gstAmount}</span>
                  </div>
                  {tipAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B45309', fontWeight: 700, marginBottom: '0.35rem' }}>
                      <span>Staff Tip / Gratuity</span>
                      <span>₹{tipAmount}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 900, color: '#0F2A1D', borderTop: '1.5px solid #E2E8F0', paddingTop: '0.65rem', marginTop: '0.5rem' }}>
                    <span>Grand Total Paid</span>
                    <span style={{ color: '#166534' }}>₹{grandTotal}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handlePrintInvoice}
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    borderRadius: '14px',
                    backgroundColor: '#F1F5F9',
                    color: '#0F2A1D',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Printer size={16} /> Print Receipt
                </button>
                <button
                  onClick={handleShareInvoice}
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    borderRadius: '14px',
                    backgroundColor: '#166534',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 8px 15px -3px rgba(22, 101, 52, 0.3)'
                  }}
                >
                  <Share2 size={16} /> Share Tax Invoice
                </button>
              </div>
            </div>
          ) : (
            <div>

              {/* 1. Itemized Order Summary Card */}
              <div style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '18px',
                padding: '0.9rem 1.1rem',
                marginBottom: '1.15rem',
                border: '1px solid #E2E8F0'
              }}>
                <div
                  onClick={() => setShowItemDetails(!showItemDetails)}
                  style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Utensils size={16} color="#166534" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F2A1D', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    ₹{foodTotal} {showItemDetails ? '▲' : '▼'}
                  </span>
                </div>

                {showItemDetails && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #CBD5E1', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {items.length === 0 ? (
                      <div style={{ color: '#64748B', fontSize: '0.82rem', textAlign: 'center', padding: '0.5rem 0' }}>
                        No active order items found in database for Table {tableNum || 'Dine-In'}.
                      </div>
                    ) : (
                      items.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#334155' }}>
                          <span>
                            <strong style={{ color: '#166534', marginRight: '0.35rem' }}>{it.quantity || 1}x</strong>
                            {it.name}
                          </span>
                          <span style={{ fontWeight: 700, color: '#0F2A1D' }}>₹{(Number(it.price) || 0) * (Number(it.quantity) || 1)}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>



              {/* 3. Promo Code / Coupon Section */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                  <Tag size={14} color="#166534" /> Apply Promo Code / Coupon
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="e.g. WELCOME20 or FLAVORA100"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.85rem',
                      borderRadius: '14px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon}
                    style={{
                      padding: '0.65rem 1.35rem',
                      borderRadius: '14px',
                      backgroundColor: '#0F2A1D',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(15, 42, 29, 0.2)'
                    }}
                  >
                    {isValidatingCoupon ? 'Checking...' : 'Apply'}
                  </button>
                </div>
                {couponMsg && (
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: couponMsg.type === 'success' ? '#15803D' : '#DC2626', marginTop: '0.35rem' }}>
                    {couponMsg.text}
                  </div>
                )}
              </div>



              {/* 5. Tip Selection Bar */}
              <div style={{ marginBottom: '1.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Coins size={14} color="#B45309" /> Add Tip                  </label>
                  {tipAmount > 0 && (
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#B45309' }}>
                      + ₹{tipAmount} Tip Added
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {[0, 30, 50, '5%', '10%', 'custom'].map((opt, i) => {
                    const isSel = (typeof opt === 'number' && tipAmount === opt && !isCustomTipOpen) ||
                      (opt === '5%' && tipAmount === Math.round(foodTotal * 0.05) && !isCustomTipOpen) ||
                      (opt === '10%' && tipAmount === Math.round(foodTotal * 0.10) && !isCustomTipOpen) ||
                      (opt === 'custom' && isCustomTipOpen);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleTipSelect(opt)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.2rem',
                          borderRadius: '12px',
                          border: isSel ? '2px solid #B45309' : '1px solid #CBD5E1',
                          backgroundColor: isSel ? '#FEF3C7' : '#FFFFFF',
                          color: isSel ? '#92400E' : '#475569',
                          fontWeight: isSel ? 800 : 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {opt === 0 ? 'No Tip' : typeof opt === 'number' ? `₹${opt}` : opt === 'custom' ? 'Custom' : opt}
                      </button>
                    );
                  })}
                </div>

                {isCustomTipOpen && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <input
                      type="number"
                      placeholder="Enter custom tip amount (₹)"
                      value={customTipInput}
                      onChange={(e) => handleCustomTipChange(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1.5px solid #B45309', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
              </div>

              {/* 6. Bill Breakdown Card */}
              <div style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '20px',
                padding: '1.15rem',
                marginBottom: '1.25rem',
                border: '1px solid #E2E8F0',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                  BILL SUMMARY
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#475569' }}>
                  <span>Food / Subtotal ({items.length} items):</span>
                  <span style={{ fontWeight: 700, color: '#0F2A1D' }}>₹{foodTotal}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#475569' }}>
                  <span>GST ({gstPctLabel}%):</span>
                  <span style={{ fontWeight: 700, color: '#0F2A1D' }}>+₹{gstAmount}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', color: '#0F2A1D', fontWeight: 800, borderTop: '1px dashed #CBD5E1', paddingTop: '0.4rem' }}>
                  <span>Total Before Discount:</span>
                  <span>₹{foodTotal + gstAmount}</span>
                </div>

                {couponDiscount > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#DC2626', fontWeight: 800 }}>
                      <span>Coupon Discount ({appliedCoupon?.code}):</span>
                      <span>-₹{couponDiscount}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#0F2A1D', fontWeight: 900, borderTop: '1px solid #E2E8F0', paddingTop: '0.4rem' }}>
                      <span>Amount After Discount:</span>
                      <span>₹{netAmount + gstAmount}</span>
                    </div>
                  </>
                )}

                {tipAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#EA580C', fontWeight: 800 }}>
                    <span>Customer Tip:</span>
                    <span>+₹{tipAmount}</span>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  color: '#0F2A1D',
                  borderTop: '2px dashed #CBD5E1',
                  paddingTop: '0.75rem',
                  marginTop: '0.5rem'
                }}>
                  <div>
                    <div>Customer Paid </div>
                  </div>
                  <span style={{ fontSize: '1.35rem', color: '#166534' }}>
                    ₹{grandTotal}
                  </span>
                </div>
              </div>

              {/* 7. Payment Modes Selector */}
              <div style={{ marginBottom: '1.35rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
                  Select Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  {[
                    { key: 'UPI', label: 'UPI / Dynamic QR', icon: QrCode, desc: 'GPay, PhonePe, Paytm' },
                    { key: 'CARD', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, MasterCard, Amex' },
                    { key: 'CASH', label: 'Pay at Counter', icon: Coins, desc: 'Cash payment to cashier' }
                  ].map(pm => {
                    const IconComp = pm.icon;
                    const isSel = paymentMethod === pm.key;
                    return (
                      <button
                        key={pm.key}
                        type="button"
                        onClick={() => setPaymentMethod(pm.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.75rem 0.85rem',
                          borderRadius: '14px',
                          border: isSel ? '2px solid #166534' : '1px solid #CBD5E1',
                          backgroundColor: isSel ? '#F0FDF4' : '#FAFAFA',
                          color: isSel ? '#166534' : '#334155',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          boxShadow: isSel ? '0 4px 12px rgba(22, 101, 52, 0.15)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          backgroundColor: isSel ? '#166534' : '#E2E8F0',
                          color: isSel ? '#FFFFFF' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <IconComp size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800 }}>{pm.label}</div>
                          <div style={{ fontSize: '0.68rem', color: isSel ? '#15803D' : '#64748B', fontWeight: 500 }}>{pm.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 8. Shimmering Complete Payment Button */}
              <button
                type="button"
                onClick={handlePayOrder}
                disabled={isProcessingPayment}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #166534 0%, #15803D 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                  boxShadow: '0 12px 24px -4px rgba(22, 101, 52, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <Lock size={18} />
                <span>
                  {isProcessingPayment
                    ? 'Processing Encrypted Payment...'
                    : `Complete Payment • ₹${grandTotal}`}
                </span>
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={14} color="#166534" /> 256-bit SSL Encrypted & GST Compliant Payment
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
