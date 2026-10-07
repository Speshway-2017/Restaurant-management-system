export const formatMoney = (val) => {
  const num = Number(val) || 0;
  if (num % 1 === 0) {
    return num.toLocaleString('en-IN');
  }
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const parseGstRate = (rawGst) => {
  if (rawGst === undefined || rawGst === null || rawGst === '') return 5;
  const num = parseFloat(String(rawGst).replace(/[^0-9.]/g, ''));
  return isNaN(num) || num < 0 ? 5 : num;
};

export const formatRateDisplay = (rate) => {
  const num = Number(rate) || 0;
  return (num % 1 === 0 ? num.toFixed(0) : num.toFixed(1)) + '%';
};

export const getBillingDetails = (order, brandingSettings) => {
  const items = Array.isArray(order?.items) ? order.items : [];
  const nonCancelledItems = items.filter(it => it && it.status !== 'CANCELLED' && it.status !== 'Cancelled' && !it.isCancelled);

  const calculatedSubtotal = nonCancelledItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);

  const isStoredBill = Boolean(
    order?.isBillGenerated ||
    order?.billGenerated ||
    order?.status === 'Completed' ||
    order?.status === 'Bill Generated' ||
    order?.status === 'Paid' ||
    order?.payment === 'Paid' ||
    order?.paymentStatus === 'Paid' ||
    order?.payment === 'Awaiting Payment' ||
    order?.paymentStatus === 'Awaiting Payment'
  );

  // 1. Subtotal
  const subtotal = (isStoredBill && order?.subtotal !== undefined && order?.subtotal !== null && Number(order.subtotal) >= 0)
    ? Number(order.subtotal)
    : calculatedSubtotal;

  // 2. Determine total GST rate (stored bill preserves original GST rate)
  const activeAdminGstRate = parseGstRate(brandingSettings?.gstRate);
  const hasStoredGstRate = order?.gstRate !== undefined && order?.gstRate !== null && order?.gstRate !== '';
  const storedTotalGstRate = hasStoredGstRate ? parseGstRate(order.gstRate) : null;

  const totalGstRate = (isStoredBill && storedTotalGstRate !== null) ? storedTotalGstRate : activeAdminGstRate;

  // 3. CGST and SGST rates (split total GST rate equally)
  const cgstRate = (isStoredBill && order?.cgstRate !== undefined && order?.cgstRate !== null)
    ? Number(order.cgstRate)
    : (totalGstRate / 2);

  const sgstRate = (isStoredBill && order?.sgstRate !== undefined && order?.sgstRate !== null)
    ? Number(order.sgstRate)
    : (totalGstRate / 2);

  // 4. CGST, SGST, and GST amounts
  const cgstAmount = (isStoredBill && order?.cgstAmount !== undefined && order?.cgstAmount !== null)
    ? Number(order.cgstAmount)
    : Number(((subtotal * cgstRate) / 100).toFixed(2));

  const sgstAmount = (isStoredBill && order?.sgstAmount !== undefined && order?.sgstAmount !== null)
    ? Number(order.sgstAmount)
    : Number(((subtotal * sgstRate) / 100).toFixed(2));

  const gstAmount = (isStoredBill && order?.gstAmount !== undefined && order?.gstAmount !== null)
    ? Number(order.gstAmount)
    : Number((cgstAmount + sgstAmount).toFixed(2));

  // 5. Tip (excluded from GST calculation)
  const tipAmount = Number(order?.tipAmount ?? order?.tip ?? 0);

  // 6. Grand Total = subtotal + gstAmount (+ tipAmount)
  const calculatedGrandTotal = Number((subtotal + gstAmount + tipAmount).toFixed(2));

  const grandTotal = (isStoredBill && order?.grandTotal !== undefined && order?.grandTotal !== null)
    ? Number(order.grandTotal)
    : ((isStoredBill && order?.finalAmount !== undefined && order?.finalAmount !== null)
      ? Number(order.finalAmount)
      : calculatedGrandTotal);

  return {
    subtotal,
    totalGstRate,
    cgstRate,
    sgstRate,
    cgstAmount,
    sgstAmount,
    gstAmount,
    tipAmount,
    grandTotal,
    nonCancelledItems,
    isStoredBill,
    cgstLabel: `CGST @ ${formatRateDisplay(cgstRate)}`,
    sgstLabel: `SGST @ ${formatRateDisplay(sgstRate)}`,
    gstLabel: `GST (${formatRateDisplay(totalGstRate)})`
  };
};