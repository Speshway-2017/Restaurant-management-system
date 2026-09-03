/**
 * Normalizes an order item object to enforce consistent status, isReady, and isDelivered flags.
 * Item statuses follow: PREPARING -> READY -> SERVED (or DELIVERED).
 */
export const normalizeOrderItem = (item) => {
  if (!item) return item;

  const statusStr = String(item.status || '').toUpperCase().trim();
  if (statusStr === 'CANCELLED' || statusStr === 'CANCEL') {
    return {
      ...item,
      status: 'CANCELLED',
      isReady: false,
      isDelivered: false
    };
  }

  const isDelivered = Boolean(
    item.isDelivered === true || 
    statusStr === 'DELIVERED' || 
    statusStr === 'SERVED' || 
    statusStr === 'COMPLETED'
  );
  
  const isReady = Boolean(
    !isDelivered && (
      item.isReady === true || 
      statusStr === 'READY' || 
      statusStr === 'PASSED'
    )
  );

  const isCooking = Boolean(
    !isDelivered && !isReady && (
      statusStr === 'COOKING' ||
      statusStr === 'PREPARING'
    )
  );

  const status = isDelivered ? 'SERVED' : (isReady ? 'READY' : (isCooking ? 'COOKING' : 'PLACED'));

  return {
    ...item,
    status,
    isReady: isDelivered || isReady,
    isDelivered
  };
};

/**
 * Merges item arrays from DB and local storage using strict status precedence:
 * SERVED (DELIVERED) > READY > COOKING > PLACED.
 * Stale data will never overwrite higher precedence status.
 */
export const mergeOrderItems = (dbItems = [], localItems = []) => {
  const maxLength = Math.max(dbItems.length, localItems.length);
  const result = [];

  for (let idx = 0; idx < maxLength; idx++) {
    const dbItem = dbItems[idx];
    const localItem = localItems[idx] || (dbItem ? localItems.find(li => li.name === dbItem.name) : null);

    const normDb = dbItem ? normalizeOrderItem(dbItem) : null;
    const normLocal = localItem ? normalizeOrderItem(localItem) : null;

    if (normDb && normLocal) {
      if (normDb.status === 'CANCELLED' || normLocal.status === 'CANCELLED') {
        result.push({
          ...(normDb || normLocal),
          status: 'CANCELLED',
          isReady: false,
          isDelivered: false
        });
        continue;
      }
      const isDelivered = normDb.isDelivered || normLocal.isDelivered;
      const isReady = isDelivered || normDb.isReady || normLocal.isReady;
      const isCooking = !isDelivered && !isReady && (normDb.status === 'COOKING' || normDb.status === 'PREPARING' || normLocal.status === 'COOKING' || normLocal.status === 'PREPARING');
      const status = isDelivered ? 'SERVED' : (isReady ? 'READY' : (isCooking ? 'COOKING' : 'PLACED'));

      result.push({
        ...normDb,
        status,
        isReady,
        isDelivered
      });
    } else if (normDb) {
      result.push(normDb);
    } else if (normLocal) {
      result.push(normLocal);
    }
  }

  return result;
};

/**
 * Derives overall order status from items list.
 * An order is COMPLETED ONLY when totalCount > 0 AND servedCount === totalCount.
 * Otherwise, it remains INCOMPLETE (Placed, Preparing, Ready, or PARTIALLY SERVED).
 */
export const deriveOrderStatus = (items = [], currentOrderStatus = 'Placed') => {
  const normItems = (items || []).map(normalizeOrderItem);
  const totalCount = normItems.length;

  if (totalCount === 0) return currentOrderStatus || 'Placed';

  const servedCount = normItems.filter(i => i.isDelivered || i.status === 'SERVED' || i.status === 'DELIVERED').length;
  const readyCount = normItems.filter(i => !i.isDelivered && i.status !== 'SERVED' && i.status !== 'DELIVERED' && (i.isReady || i.status === 'READY')).length;

  if (servedCount === totalCount) {
    return 'Served'; // All items served -> COMPLETED
  }
  if (servedCount > 0) {
    return 'PARTIALLY DELIVERED'; // Partial items served -> INCOMPLETE
  }
  if (readyCount === totalCount || (readyCount > 0 && readyCount + servedCount === totalCount)) {
    return 'Ready'; // All remaining items ready!
  }
  if (readyCount > 0) {
    return 'Preparing'; // Partial items ready -> Order remains in Preparing with partial items ready
  }
  return currentOrderStatus === 'Placed' ? 'Placed' : 'Preparing';
};

/**
 * Consistently formats any table string or number into standard "T-01" format.
 * e.g., "Table 01" -> "T-01", "Table T-03" -> "T-03", "2" -> "T-02", "T-08" -> "T-08".
 */
export const formatTableNumber = (rawTable) => {
  if (!rawTable) return 'T-01';
  const str = String(rawTable).trim();
  const digits = str.replace(/[^0-9]/g, '');
  if (!digits) return 'T-01';
  const num = parseInt(digits, 10);
  return `T-${String(num).padStart(2, '0')}`;
};

/**
 * Clears all active table order, cart, and guest session local/session storage keys
 * when a dining session closes or when a table moves to Available/Cleaning.
 */
export const clearTableSessionStorage = (rawTable) => {
  if (!rawTable) return;
  const str = String(rawTable).trim();
  const digits = str.replace(/[^0-9]/g, '');
  const cleanTbl = str.toUpperCase().replace('TABLE', '').replace('T-', '').trim();

  const keysToRemove = [
    `flavora_table_orders_${str}`,
    `flavora_table_orders_${cleanTbl}`,
    `flavora_table_orders_T-${cleanTbl}`,
    `flavora_cart_${str}`,
    `flavora_cart_${cleanTbl}`,
    `flavora_cart_T-${cleanTbl}`
  ];

  if (digits) {
    const pad = digits.padStart(2, '0');
    keysToRemove.push(
      `flavora_table_orders_T-${pad}`,
      `flavora_table_orders_${digits}`,
      `flavora_cart_T-${pad}`,
      `flavora_cart_${digits}`
    );
  }

  keysToRemove.forEach(k => {
    try { localStorage.removeItem(k); } catch (e) {}
  });

  const sessionKeysToRemove = [
    `flavora_guest_name_${cleanTbl}`,
    `flavora_guest_name_${str}`,
    `flavora_order_submitted_${cleanTbl}`,
    `flavora_order_submitted_${str}`
  ];

  if (digits) {
    const pad = digits.padStart(2, '0');
    sessionKeysToRemove.push(
      `flavora_guest_name_T-${pad}`,
      `flavora_guest_name_${digits}`,
      `flavora_order_submitted_T-${pad}`,
      `flavora_order_submitted_${digits}`
    );
  }

  sessionKeysToRemove.forEach(k => {
    try { sessionStorage.removeItem(k); } catch (e) {}
  });

  try {
    window.dispatchEvent(new Event('flavora_cart_updated'));
    window.dispatchEvent(new Event('flavora_orders_updated'));
    window.dispatchEvent(new Event('flavora_tables_updated'));
  } catch (e) {}
};
