/**
 * Normalizes an order item object to enforce consistent status, isReady, and isDelivered flags.
 * Item statuses follow: PREPARING -> READY -> SERVED (or DELIVERED).
 */
export const normalizeOrderItem = (item) => {
  if (!item) return item;

  const statusStr = String(item.status || '').toUpperCase();
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

  const status = isDelivered ? 'SERVED' : (isReady ? 'READY' : 'PREPARING');

  return {
    ...item,
    status,
    isReady: isDelivered || isReady,
    isDelivered
  };
};

/**
 * Merges item arrays from DB and local storage using strict status precedence:
 * SERVED (DELIVERED) > READY > PREPARING.
 * Stale data with 'PREPARING' will never overwrite 'READY' or 'SERVED'.
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
      const isDelivered = normDb.isDelivered || normLocal.isDelivered;
      const isReady = isDelivered || normDb.isReady || normLocal.isReady;
      const status = isDelivered ? 'SERVED' : (isReady ? 'READY' : 'PREPARING');

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
  if (readyCount > 0) {
    return 'Ready'; // Some items ready -> INCOMPLETE
  }
  return currentOrderStatus === 'Placed' ? 'Placed' : 'Preparing';
};
