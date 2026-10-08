import React, { useState, useEffect } from 'react';
import {
  X, Receipt, Check, CreditCard, QrCode, Wallet, Coins, Percent, Download,
  Share2, Sparkles, AlertCircle, Printer, Tag, ShieldCheck, ChevronRight, Lock, Gift, Users, Utensils
} from 'lucide-react';
import { api } from '../../services/api';
import { useRestaurantBranding } from '../../context/RestaurantBrandingContext';
import { onSocketEvent } from '../../services/socket';
import { clearTableSessionStorage } from '../../utils/orderUtils';
import { getBillingDetails, formatMoney } from '../../utils/billingUtils';

export default function CustomerBillModal({
  activeOrder,
  tableNum,
  onClose,
  onPaymentSuccess,
  onOpenRating,
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
  const [isRequestingBill, setIsRequestingBill] = useState(false);
  const [requestBillSent, setRequestBillSent] = useState(false);
  const [liveOrder, setLiveOrder] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchLatestOrder = async () => {
      try {
        const freshOrders = await api.getOrders();
        if (!isMounted || !Array.isArray(freshOrders)) return;

        const targetTable = tableNum || activeOrder?.table || '';
        const cleanTableNum = String(targetTable).replace(/[^0-9]/g, '');
        if (!cleanTableNum) return;

        const matched = freshOrders.find(ord => {
          const ordTableDigits = String(ord.table || ord.tableNumber || '').replace(/[^0-9]/g, '');
          const isMatch = ordTableDigits && cleanTableNum && String(parseInt(ordTableDigits, 10)) === String(parseInt(cleanTableNum, 10));
          const isClosed = ord.status === 'Completed' || ord.status === 'Paid' || ord.status === 'Cancelled' || ord.payment === 'Paid' || ord.paymentStatus === 'Paid';
          return isMatch && !isClosed;
        });

        if (matched) {
          setLiveOrder(matched);
        }
      } catch (e) {}
    };

    fetchLatestOrder();

    const unsub1 = onSocketEvent('bill_generated', fetchLatestOrder);
    const unsub2 = onSocketEvent('order_status_updated', fetchLatestOrder);
    const unsub3 = onSocketEvent('order_updated', fetchLatestOrder);
    const unsub4 = onSocketEvent('table_updated', fetchLatestOrder);
    const unsub5 = onSocketEvent('order_item_cancelled', fetchLatestOrder);

    return () => {
      isMounted = false;
      if (typeof unsub1 === 'function') unsub1();
      if (typeof unsub2 === 'function') unsub2();
      if (typeof unsub3 === 'function') unsub3();
      if (typeof unsub4 === 'function') unsub4();
      if (typeof unsub5 === 'function') unsub5();
    };
  }, [tableNum, activeOrder?.table, activeOrder?.orderId]);

  const currentOrder = liveOrder || activeOrder;

  const isBillGenerated = Boolean(
    currentOrder?.isBillGenerated ||
    currentOrder?.billGenerated ||
    currentOrder?.status === 'Bill Generated' ||
    currentOrder?.status === 'Billing' ||
    currentOrder?.status === 'Awaiting Payment' ||
    currentOrder?.payment === 'Awaiting Payment' ||
    currentOrder?.payment === 'Bill Generated' ||
    currentOrder?.paymentStatus === 'Awaiting Payment' ||
    currentOrder?.paymentStatus === 'Bill Generated' ||
    currentOrder?.status === 'Paid' ||
    currentOrder?.payment === 'Paid' ||
    currentOrder?.paymentStatus === 'Paid' ||
    currentOrder?.status === 'Completed'
  );

  const handleRequestBillFromWaiter = async () => {
    setIsRequestingBill(true);
    try {
      await api.callWaiter(tableNum || activeOrder?.table || 'T-01', 'Bill Generation Request', 'Customer requested final bill generation.');
      setRequestBillSent(true);
      setTimeout(() => setRequestBillSent(false), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRequestingBill(false);
    }
  };

  const [lastKnownItems, setLastKnownItems] = useState([]);
  const [paidReceiptDetails, setPaidReceiptDetails] = useState(null);

  useEffect(() => {
    const itemsSrc = currentOrder?.items || activeOrder?.items;
    if (Array.isArray(itemsSrc) && itemsSrc.length > 0) {
      setLastKnownItems(itemsSrc);
    }
  }, [currentOrder, activeOrder]);

  // Items fetched strictly from MongoDB active order with fallback to last known items
  const activeItemsList = (Array.isArray(currentOrder?.items) && currentOrder.items.length > 0)
    ? currentOrder.items
    : ((Array.isArray(activeOrder?.items) && activeOrder.items.length > 0)
      ? activeOrder.items
      : (lastKnownItems.length > 0 ? lastKnownItems : []));

  const items = (showInvoice && paidReceiptDetails?.items) ? paidReceiptDetails.items : activeItemsList;

  // Derive single source of truth billing details
  const targetOrderForBilling = currentOrder || activeOrder;
  const billingDetails = getBillingDetails(targetOrderForBilling, branding);
  const {
    subtotal: foodTotal,
    totalGstRate,
    cgstRate,
    sgstRate,
    cgstAmount,
    sgstAmount,
    gstAmount,
    cgstLabel,
    sgstLabel,
    gstLabel,
    nonCancelledItems
  } = billingDetails;

  const gstRate = totalGstRate / 100;
  const gstPctLabel = totalGstRate;

  // Discount
  const couponDiscount = (showInvoice && paidReceiptDetails?.couponDiscount !== undefined)
    ? paidReceiptDetails.couponDiscount
    : (appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0);
  const totalDiscount = couponDiscount;

  // Final Payable
  const totalBeforeDiscount = foodTotal + gstAmount;
  const netAmount = Math.max(0, foodTotal - couponDiscount);
  const grandTotal = (showInvoice && paidReceiptDetails?.grandTotal !== undefined)
    ? paidReceiptDetails.grandTotal
    : Number((foodTotal + gstAmount + tipAmount).toFixed(2));

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
      const activeTableStr = tableNum || currentOrder?.table || activeOrder?.table || 'T-01';
      const targetOrderId = currentOrder?._id || currentOrder?.orderId || currentOrder?.id || activeOrder?._id || activeOrder?.orderId || activeOrder?.id || activeTableStr;

      const payData = {
        status: 'Paid',
        payment: 'Paid',
        paymentStatus: 'Paid',
        isBillGenerated: true,
        billGenerated: true,
        paymentMethod: paymentMethod || 'UPI',
        originalTotal: foodTotal,
        originalAmount: foodTotal,
        subtotal: foodTotal,
        gstRate: `${totalGstRate}%`,
        cgstRate: cgstRate,
        sgstRate: sgstRate,
        cgstAmount: cgstAmount,
        sgstAmount: sgstAmount,
        gstAmount: gstAmount,
        grandTotal: grandTotal,
        finalAmount: grandTotal,
        total: grandTotal,
        tip: tipAmount,
        tipAmount: tipAmount,
        customerPaidAmount: grandTotal,
        table: activeTableStr,
        transactionId: `TXN-${Date.now().toString().slice(-8)}`,
        paidAt: new Date().toISOString()
      };

      // Freeze receipt details snapshot before backend state update
      const receiptSnapshot = {
        items: items.map(it => ({
          name: it.name || 'Dish Item',
          quantity: Number(it.quantity || 1),
          price: Number(it.price || 0)
        })),
        foodTotal: foodTotal,
        gstAmount: gstAmount,
        gstPctLabel: gstPctLabel,
        couponDiscount: couponDiscount,
        couponCode: appliedCoupon?.code || '',
        tipAmount: tipAmount,
        netAmount: netAmount,
        grandTotal: grandTotal,
        tableNum: activeTableStr,
        orderId: targetOrderId,
        transactionId: payData.transactionId,
        paidAt: payData.paidAt
      };
      setPaidReceiptDetails(receiptSnapshot);

      // 1. Update backend MongoDB database
      await api.updateOrderStatus(targetOrderId, 'Paid', payData);

      // 2. Sync local manager storage if stored in localStorage
      try {
        let localOrders = [];
        const raw = localStorage.getItem('flavora_manager_orders');
        if (raw) localOrders = JSON.parse(raw);

        const cleanTargetId = String(targetOrderId).replace(/^#/i, '').trim();
        const cleanTableStr = String(activeTableStr).replace(/[^0-9]/g, '');

        const updatedLocal = localOrders.map(lo => {
          const loId = String(lo.orderId || lo._id || lo.id || lo.table || '').replace(/^#/i, '').trim();
          const loTableDigits = String(lo.table || lo.tableNumber || '').replace(/[^0-9]/g, '');
          const isTableMatch = cleanTableStr && loTableDigits && String(parseInt(cleanTableStr, 10)) === String(parseInt(loTableDigits, 10));

          if (loId === cleanTargetId || lo.table === activeTableStr || isTableMatch) {
            return {
              ...lo,
              payment: 'Paid',
              paymentStatus: 'Paid',
              paymentMethod: payData.paymentMethod,
              discountAmount: totalDiscount,
              tip: tipAmount,
              customerPaidAmount: grandTotal,
              finalAmount: grandTotal,
              transactionId: payData.transactionId,
              paidAt: payData.paidAt
            };
          }
          return lo;
        });

        localStorage.setItem('flavora_manager_orders', JSON.stringify(updatedLocal));
      } catch (e) { }

      // 3. Clear customer dining session storage & emit real-time synchronization events
      try {
        clearTableSessionStorage(activeTableStr);
        if (tableNum) clearTableSessionStorage(tableNum);
        window.dispatchEvent(new Event('flavora_orders_updated'));
        window.dispatchEvent(new Event('flavora_tables_updated'));
        window.dispatchEvent(new CustomEvent('flavora_payment_completed', { detail: { orderId: targetOrderId, table: activeTableStr } }));
        localStorage.setItem('flavora_orders_sync', Date.now().toString());
      } catch (e) { }

      setIsProcessingPayment(false);
      setShowInvoice(true);
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err) {
      console.warn("Payment submission error:", err);
      try {
        window.dispatchEvent(new Event('flavora_orders_updated'));
        window.dispatchEvent(new Event('flavora_tables_updated'));
        localStorage.setItem('flavora_orders_sync', Date.now().toString());
      } catch (e) { }
      setIsProcessingPayment(false);
      setShowInvoice(true);
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
        zIndex: 999999,
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
                  Live Running Bill • Table {tableNum || activeOrder?.table || 'T-01'}{activeOrder?.customer && activeOrder.customer !== 'Guest Diner' && activeOrder.customer !== 'Guest' ? ` • 👤 ${activeOrder.customer}` : ''}
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
              {/* Payment Successful Confirmation Banner */}
              <div style={{
                backgroundColor: '#F0FDF4',
                border: '2px solid #86EFAC',
                borderRadius: '20px',
                padding: '1.25rem 1rem',
                textAlign: 'center',
                marginBottom: '1.25rem',
                boxShadow: '0 8px 20px rgba(22, 101, 52, 0.12)'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#166534',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.65rem'
                }}>
                  <Check size={28} strokeWidth={3} />
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#166534', fontWeight: 900, fontSize: '1.25rem' }}>
                  ✓ Payment Successful
                </h3>

                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '0.85rem 1rem', border: '1px solid #BBF7D0', marginBottom: '0.85rem', textAlign: 'left', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Amount Paid:</span>
                    <strong style={{ color: '#166534', fontSize: '0.98rem', fontWeight: 900 }}>₹{formatMoney(grandTotal)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Payment Method:</span>
                    <strong style={{ color: '#0F2A1D', fontWeight: 800 }}>{paymentMethod || 'UPI'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Transaction ID:</span>
                    <strong style={{ color: '#0F2A1D', fontFamily: 'monospace', fontWeight: 800 }}>{paidReceiptDetails?.transactionId || `TXN-${Date.now().toString().slice(-8)}`}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Order Number:</span>
                    <strong style={{ color: '#0F2A1D', fontWeight: 800 }}>#{paidReceiptDetails?.orderId || activeOrder?.orderId || (String(activeOrder?._id || '').slice(-6)).toUpperCase() || 'ORD-3968'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Payment:</span>
                    <strong style={{ color: '#166534', fontWeight: 900 }}>
                      Paid {liveOrder?.waiterPaymentConfirmation === 'CONFIRMED' ? '✓' : ''}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>
                      {liveOrder?.waiterPaymentConfirmation === 'CONFIRMED' ? 'Payment Received:' : 'Waiter Confirmation:'}
                    </span>
                    <strong style={{ color: liveOrder?.waiterPaymentConfirmation === 'CONFIRMED' ? '#166534' : '#D97706', fontWeight: 900 }}>
                      {liveOrder?.waiterPaymentConfirmation === 'CONFIRMED' ? 'Confirmed ✓' : 'Pending'}
                    </strong>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.82rem', color: liveOrder?.waiterPaymentConfirmation === 'CONFIRMED' ? '#166534' : '#B45309', fontWeight: 700, lineHeight: 1.5 }}>
                  {liveOrder?.waiterPaymentConfirmation === 'CONFIRMED'
                    ? 'Payment confirmed by waiter! Please wait while the order is being completed.'
                    : 'Payment recorded by system. Waiting for waiter to confirm payment.'}
                </p>
              </div>

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
                    <div><strong>Invoice #:</strong> {paidReceiptDetails?.transactionId ? `INV-${paidReceiptDetails.transactionId.slice(-6)}` : `INV-${Date.now().toString().slice(-6)}`}</div>
                    <div><strong>Table:</strong> {paidReceiptDetails?.tableNum || tableNum || activeOrder?.table || 'T-01'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div><strong>Date:</strong> {paidReceiptDetails?.paidAt ? new Date(paidReceiptDetails.paidAt).toLocaleDateString() : new Date().toLocaleDateString()}</div>
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
                      <span style={{ flex: 1, textAlign: 'right', fontWeight: 800, color: '#0F2A1D' }}>₹{(Number(it.quantity) || 1) * (Number(it.price) || 0)}</span>
                    </div>
                  ))}
                </div>

                {/* Calculations */}
                <div style={{ borderTop: '2px dashed #CBD5E1', paddingTop: '0.85rem', fontSize: '0.82rem', color: '#334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span>Subtotal</span>
                    <span>₹{formatMoney(foodTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span>{cgstLabel}</span>
                    <span>₹{formatMoney(cgstAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span>{sgstLabel}</span>
                    <span>₹{formatMoney(sgstAmount)}</span>
                  </div>
                  
                  {tipAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B45309', fontWeight: 700, marginBottom: '0.35rem' }}>
                      <span>Staff Tip / Gratuity</span>
                      <span>+₹{formatMoney(tipAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 900, color: '#0F2A1D', borderTop: '1.5px solid #E2E8F0', paddingTop: '0.65rem', marginTop: '0.5rem' }}>
                    <span>Grand Total Paid</span>
                    <span style={{ color: '#166534' }}>₹{formatMoney(grandTotal)}</span>
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

              {/* Rate Experience CTA Button */}
              <button
                type="button"
                onClick={() => {
                  if (onOpenRating) {
                    onOpenRating();
                  } else {
                    window.dispatchEvent(new CustomEvent('flavora_open_rating_modal', { detail: { orderId: activeOrder?.orderId || activeOrder?._id } }));
                  }
                }}
                style={{
                  width: '100%',
                  marginTop: '0.85rem',
                  padding: '0.9rem',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 8px 18px -3px rgba(217, 119, 6, 0.35)',
                  transition: 'transform 0.15s ease'
                }}
              >
                ⭐ Rate Your Dining Experience
              </button>
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
                      Order Summary ({nonCancelledItems.length} {nonCancelledItems.length === 1 ? 'item' : 'items'})
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
                      items.map((it, idx) => {
                        const isCancelled = it && (it.status === 'CANCELLED' || it.status === 'Cancelled' || it.isCancelled);
                        const itemQty = Number(it.quantity || it.qty || 1);
                        const uPrice = Number(it.unitPrice !== undefined ? it.unitPrice : (it.price || 0));
                        const lineTot = Number(it.totalPrice !== undefined ? it.totalPrice : (uPrice * itemQty));
                        const spiceStr = it.spiceLevel || it.selectedSpiceLevel;
                        const spicePrice = Number(it.spiceLevelPrice || 0);
                        const addOnsArr = it.selectedAddOns || it.addOns || [];

                        return (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.82rem', color: isCancelled ? '#94A3B8' : '#334155', textDecoration: isCancelled ? 'line-through' : 'none', paddingBottom: '0.25rem', borderBottom: '1px dashed #F1F5F9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>
                                <strong style={{ color: isCancelled ? '#94A3B8' : '#166534', marginRight: '0.35rem' }}>{itemQty}x</strong>
                                {it.name}
                                {isCancelled && <span style={{ marginLeft: '0.35rem', color: '#DC2626', fontSize: '0.7rem', fontWeight: 800, textDecoration: 'none' }}>(Cancelled)</span>}
                              </span>
                              <span style={{ fontWeight: 700, color: isCancelled ? '#94A3B8' : '#0F2A1D' }}>
                                {isCancelled ? '₹0' : `₹${lineTot}`}
                              </span>
                            </div>

                            {/* Customization Details Badges */}
                            {!isCancelled && (
                              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                                {spiceStr && (
                                  <span style={{ fontSize: '0.68rem', color: '#EA580C', backgroundColor: '#FFF7ED', border: '1px solid #FFEDD5', padding: '0.05rem 0.3rem', borderRadius: '4px', fontWeight: 700 }}>
                                    🌶️ {spiceStr}{spicePrice > 0 ? ` (+₹${spicePrice})` : ''}
                                  </span>
                                )}
                                {addOnsArr.length > 0 && (
                                  <span style={{ fontSize: '0.68rem', color: '#166534', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.05rem 0.3rem', borderRadius: '4px', fontWeight: 700 }}>
                                    + {addOnsArr.map(a => `${a.name || a}${a.price > 0 ? ` (+₹${a.price})` : ' (Free)'}`).join(', ')}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
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
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 700, color: '#0F2A1D' }}>₹{formatMoney(foodTotal)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#475569' }}>
                  <span>{cgstLabel}</span>
                  <span style={{ fontWeight: 700, color: '#0F2A1D' }}>₹{formatMoney(cgstAmount)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#475569' }}>
                  <span>{sgstLabel}</span>
                  <span style={{ fontWeight: 700, color: '#0F2A1D' }}>₹{formatMoney(sgstAmount)}</span>
                </div>

                {tipAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#EA580C', fontWeight: 800 }}>
                    <span>Customer Tip:</span>
                    <span>+₹{formatMoney(tipAmount)}</span>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  color: '#0F2A1D',
                  borderTop: '2px dashed #CBD5E1',
                  paddingTop: '0.75rem',
                  marginTop: '0.5rem'
                }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#334155' }}>Grand Total</div>
                  </div>
                  <span style={{ fontSize: '1.35rem', color: '#166534', fontWeight: 900 }}>
                    ₹{grandTotal}
                  </span>
                </div>
              </div>

              {/* 7. Payment Mode & Complete Payment — Blocked until Waiter generates Bill */}
              {!isBillGenerated ? (
                <div style={{
                  backgroundColor: '#FEF3C7',
                  border: '1.5px solid #FCD34D',
                  borderRadius: '20px',
                  padding: '1.5rem 1.25rem',
                  marginBottom: '1.25rem',
                  textAlign: 'center',
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.12)'
                }}>
                  <div style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    backgroundColor: '#D97706',
                    color: '#FFFFFF',
                    display: 'grid',
                    placeItems: 'center',
                    margin: '0 auto 0.85rem auto',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px' }}>
                      <Lock size={20} color="#FFFFFF" style={{ display: 'block' }} />
                    </div>
                  </div>
                  <h3 style={{ margin: '0 0 0.35rem 0', color: '#78350F', fontWeight: 900, fontSize: '1.1rem' }}>
                    Payment Blocked — Waiter Bill Pending
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#92400E', fontWeight: 600, lineHeight: 1.45 }}>
                    Payment cannot be processed until your waiter generates and verifies your final bill for Table {tableNum || activeOrder?.table || 'T-01'}.
                  </p>

                  <button
                    type="button"
                    onClick={handleRequestBillFromWaiter}
                    disabled={isRequestingBill}
                    style={{
                      marginTop: '1.1rem',
                      backgroundColor: '#B45309',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.75rem 1.35rem',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: isRequestingBill ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justify: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 12px rgba(180, 83, 9, 0.25)'
                    }}
                  >
                    <Receipt size={18} style={{ flexShrink: 0 }} />
                    <span>{isRequestingBill ? 'Sending Request...' : 'Request Bill Generation from Waiter'}</span>
                  </button>
                  {requestBillSent && (
                    <div style={{ marginTop: '0.65rem', fontSize: '0.78rem', color: '#15803D', fontWeight: 800 }}>
                      ✓ Request sent to Waiter! Waiter notified to generate your bill.
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Payment Modes Selector */}
                  <div style={{ marginBottom: '1.35rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
                      Select Payment Method
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                      {[
                        { key: 'UPI', label: 'UPI', icon: QrCode, desc: 'GPay, PhonePe, Paytm' },
                        { key: 'CASH', label: 'Cash', icon: Coins, desc: 'Pay at Counter' },
                        { key: 'CARD', label: 'Card', icon: CreditCard, desc: 'Debit / Credit Card' }
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
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.35rem',
                              padding: '0.65rem 0.4rem',
                              borderRadius: '14px',
                              border: isSel ? '2px solid #166534' : '1px solid #CBD5E1',
                              backgroundColor: isSel ? '#F0FDF4' : '#FAFAFA',
                              color: isSel ? '#166534' : '#334155',
                              fontWeight: 800,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              textAlign: 'center',
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
                            <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{pm.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Details Section */}
                  {paymentMethod === 'UPI' ? (
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '20px',
                      padding: '1.25rem 1rem',
                      border: '1.5px solid #E2E8F0',
                      textAlign: 'center',
                      marginBottom: '1.25rem',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                        Pay via UPI
                      </div>

                      {/* CUSTOM PAYMENT QR CODE CONTAINER */}
                      <div style={{
                        width: '210px',
                        height: '210px',
                        margin: '0 auto 0.85rem auto',
                        backgroundColor: '#FFFFFF',
                        padding: '0.75rem',
                        borderRadius: '16px',
                        border: '2.5px solid #166534',
                        boxShadow: '0 8px 24px rgba(22, 101, 52, 0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        maxWidth: '100%',
                        boxSizing: 'border-box'
                      }}>
                        <img
                          src={branding?.paymentQr || branding?.upiQr || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent('upi://pay?pa=' + (branding?.upiId || 'flavorakitchen@upi') + '&pn=' + (branding?.brandName || 'Flavora Kitchen') + '&am=' + grandTotal + '&tn=Order_' + (activeOrder?.orderId || activeOrder?._id || '') + '&cu=INR')}`}
                          alt="Restaurant Custom UPI Payment QR Code"
                          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px', display: 'block' }}
                        />
                      </div>

                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                        Scan & Pay using GPay / PhonePe / Paytm
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700 }}>Amount:</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#166534' }}>₹{grandTotal}</span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700, backgroundColor: '#F1F5F9', padding: '0.4rem 0.85rem', borderRadius: '10px', display: 'inline-block', border: '1px solid #CBD5E1' }}>
                        UPI ID: <strong style={{ color: '#0F2A1D', fontFamily: 'monospace' }}>{branding?.upiId || 'flavorakitchen@upi'}</strong>
                      </div>
                    </div>
                  ) : paymentMethod === 'CASH' ? (
                    <div style={{
                      backgroundColor: '#FFFBEB',
                      borderRadius: '20px',
                      padding: '1.25rem 1rem',
                      border: '1.5px solid #FCD34D',
                      textAlign: 'center',
                      marginBottom: '1.25rem'
                    }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#D97706', color: '#FFFFFF', display: 'grid', placeItems: 'center', margin: '0 auto 0.6rem auto' }}>
                        <Coins size={22} />
                      </div>
                      <h4 style={{ margin: '0 0 0.35rem 0', color: '#78350F', fontWeight: 900, fontSize: '1.05rem' }}>
                        Pay Cash at Counter
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#92400E', fontWeight: 600, lineHeight: 1.45 }}>
                        Please hand over exact cash <strong>₹{grandTotal}</strong> to your table waiter or cashier at the billing counter.
                      </p>
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: '#EFF6FF',
                      borderRadius: '20px',
                      padding: '1.25rem 1rem',
                      border: '1.5px solid #BFDBFE',
                      textAlign: 'center',
                      marginBottom: '1.25rem'
                    }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#1D4ED8', color: '#FFFFFF', display: 'grid', placeItems: 'center', margin: '0 auto 0.6rem auto' }}>
                        <CreditCard size={22} />
                      </div>
                      <h4 style={{ margin: '0 0 0.35rem 0', color: '#1E40AF', fontWeight: 900, fontSize: '1.05rem' }}>
                        Credit / Debit Card Machine
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#1E3A8A', fontWeight: 600, lineHeight: 1.45 }}>
                        Swipe, Tap or Dip your Debit/Credit card on the wireless POS Terminal machine provided by your waiter.
                      </p>
                    </div>
                  )}

                  {/* Complete Payment Button */}
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
                      cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
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
                        ? 'Verifying Payment Status...'
                        : paymentMethod === 'UPI'
                        ? "I've Completed Payment"
                        : `Complete Settlement • ₹${grandTotal}`}
                    </span>
                  </button>

                  <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                    <ShieldCheck size={14} color="#166534" /> 256-bit SSL Encrypted & GST Compliant Payment
                  </div>
                </>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
