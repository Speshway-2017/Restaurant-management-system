/**
 * Group raw tables from the backend into logical floor plan card items.
 * Unmerged physical tables are rendered as individual card items.
 * Merged physical tables with shared mergeGroupId or interlocking mergedWith arrays
 * are grouped into ONE single combined card item.
 */
export function groupTablesForFloorPlan(rawTables = []) {
  if (!Array.isArray(rawTables) || rawTables.length === 0) return [];

  const processedTableNumbers = new Set();
  const displayItems = [];

  rawTables.forEach(table => {
    const tableNum = String(table.number || table.num || '').trim();
    if (!tableNum || processedTableNumbers.has(tableNum)) return;

    const mergedWithList = Array.isArray(table.mergedWith)
      ? table.mergedWith.map(n => String(n).trim()).filter(n => n && n !== tableNum)
      : [];
    const hasMergedWith = mergedWithList.length > 0;
    const mergeGroupId = table.mergeGroupId || (table.activeSession ? table.activeSession.mergeGroupId : '');

    if (!hasMergedWith && !mergeGroupId) {
      // Individual unmerged table card
      processedTableNumbers.add(tableNum);
      const isAvailable = table.status === 'Available' || table.status === 'Cleaning';
      displayItems.push({
        isMergedGroup: false,
        _id: table._id || table.id || tableNum,
        displayId: table._id || table.id || tableNum,
        displayNumber: tableNum,
        number: tableNum,
        num: tableNum,
        tableNumbers: [tableNum],
        primaryTableNumber: tableNum,
        seats: Number(table.seats || table.cap || 4),
        capacity: Number(table.seats || table.cap || 4),
        section: table.section || table.zone || 'Main Dining',
        zone: table.section || table.zone || 'Main Dining',
        status: table.status || 'Available',
        activeSession: isAvailable ? null : (table.activeSession || null),
        activeOrder: isAvailable ? null : (table.activeOrder || null),
        reservation: table.reservation || null,
        rawTables: [table],
        originalTable: table
      });
    } else {
      // Find all physical tables belonging to this merged group
      const allGroupTableNums = Array.from(new Set([tableNum, ...mergedWithList]));

      const groupMemberTables = rawTables.filter(t => {
        const tNum = String(t.number || t.num || '').trim();
        if (allGroupTableNums.includes(tNum)) return true;
        if (mergeGroupId && (t.mergeGroupId === mergeGroupId || (t.activeSession && t.activeSession.mergeGroupId === mergeGroupId))) return true;
        if (Array.isArray(t.mergedWith) && t.mergedWith.some(m => allGroupTableNums.includes(String(m).trim()))) return true;
        return false;
      });

      // Mark all member tables as processed so they are not rendered as duplicate cards
      groupMemberTables.forEach(t => {
        const tNum = String(t.number || t.num || '').trim();
        if (tNum) processedTableNumbers.add(tNum);
      });

      const sortedMemberNums = groupMemberTables.map(t => String(t.number || t.num || '').trim()).sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
        return numA - numB;
      });

      const combinedSeats = groupMemberTables.reduce((sum, t) => sum + (Number(t.seats || t.cap || 0)), 0);
      const primaryTbl = groupMemberTables.find(t => String(t.number || t.num || '').trim() === tableNum) || groupMemberTables[0];

      // Group status priority: Occupied > Billing > Cleaning > Reserved > Available
      let groupStatus = primaryTbl.status || 'Available';
      if (groupMemberTables.some(t => t.status === 'Occupied')) groupStatus = 'Occupied';
      else if (groupMemberTables.some(t => t.status === 'Billing')) groupStatus = 'Billing';
      else if (groupMemberTables.some(t => t.status === 'Cleaning')) groupStatus = 'Cleaning';
      else if (groupMemberTables.some(t => t.status === 'Reserved')) groupStatus = 'Reserved';
      else if (groupMemberTables.every(t => t.status === 'Available')) groupStatus = 'Available';

      const isAvailable = groupStatus === 'Available' || groupStatus === 'Cleaning';
      const activeSession = isAvailable ? null : (groupMemberTables.map(t => t.activeSession).find(Boolean) || null);
      const activeOrder = isAvailable ? null : (groupMemberTables.map(t => t.activeOrder).find(Boolean) || null);
      const reservation = groupMemberTables.map(t => t.reservation).find(Boolean) || null;

      const combinedDisplayNumber = sortedMemberNums.join(' + ');

      displayItems.push({
        isMergedGroup: true,
        _id: `MERGED-${sortedMemberNums.join('-')}`,
        displayId: `MERGED-${sortedMemberNums.join('-')}`,
        displayNumber: combinedDisplayNumber,
        number: combinedDisplayNumber,
        num: combinedDisplayNumber,
        tableNumbers: sortedMemberNums,
        primaryTableNumber: primaryTbl.number || primaryTbl.num,
        secondaryTableNumbers: sortedMemberNums.filter(n => n !== (primaryTbl.number || primaryTbl.num)),
        seats: combinedSeats,
        capacity: combinedSeats,
        section: primaryTbl.section || primaryTbl.zone || 'Main Dining',
        zone: primaryTbl.section || primaryTbl.zone || 'Main Dining',
        status: groupStatus,
        activeSession,
        activeOrder,
        reservation,
        rawTables: groupMemberTables,
        originalTable: primaryTbl
      });
    }
  });

  return displayItems;
}
