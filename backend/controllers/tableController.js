const Table = require('../models/Table');
const QRCode = require('qrcode');

const defaultTablesList = [
  { number: 'T-01', name: 'T-01', section: 'Main Dining', seats: 4, status: 'Available', currentOrder: '' },
  { number: 'T-02', name: 'T-02', section: 'Main Dining', seats: 2, status: 'Available', currentOrder: '' },
  { number: 'T-03', name: 'T-03', section: 'Main Dining', seats: 4, status: 'Available', currentOrder: '' },
  { number: 'T-04', name: 'T-04', section: 'Main Dining', seats: 6, status: 'Available', currentOrder: '' },
  { number: 'T-05', name: 'T-05', section: 'Window Section', seats: 2, status: 'Available', currentOrder: '' },
  { number: 'T-06', name: 'T-06', section: 'Window Section', seats: 4, status: 'Available', currentOrder: '' },
  { number: 'T-07', name: 'T-07', section: 'Window Section', seats: 4, status: 'Available', currentOrder: '' },
  { number: 'T-08', name: 'T-08', section: 'Family Lounge', seats: 8, status: 'Available', currentOrder: '' },
  { number: 'T-09', name: 'T-09', section: 'Family Lounge', seats: 6, status: 'Available', currentOrder: '' },
  { number: 'T-10', name: 'T-10', section: 'Patio Outdoor', seats: 4, status: 'Available', currentOrder: '' },
  { number: 'T-11', name: 'T-11', section: 'Patio Outdoor', seats: 2, status: 'Available', currentOrder: '' },
  { number: 'T-12', name: 'T-12', section: 'Patio Outdoor', seats: 4, status: 'Available', currentOrder: '' }
];

const Reservation = require('../models/Reservation');
const TableSession = require('../models/TableSession');

const isGenericDinerName = (name) => {
  if (!name || typeof name !== 'string') return true;
  const lower = name.trim().toLowerCase();
  return !lower || lower === 'valued guest' || lower === 'guest diner' || lower === 'guest' || lower === '-' || lower === 'n/a' || lower === 'null' || lower === 'undefined';
};

const getBestDinerName = (...candidates) => {
  for (const c of candidates) {
    if (!isGenericDinerName(c)) return c.trim();
  }
  for (const c of candidates) {
    if (c && typeof c === 'string' && c.trim()) return c.trim();
  }
  return '';
};

const getTables = async (req, res) => {
  try {
    let tables = await Table.find({}).sort({ number: 1 });
    if (!tables || tables.length === 0) {
      await Table.insertMany(defaultTablesList);
      tables = await Table.find({}).sort({ number: 1 });
    }

    // Auto-expire Cleaning tables to Available if 10 minutes have elapsed
    const now = new Date();
    for (let tbl of tables) {
      if (tbl.status === 'Cleaning' && tbl.cleaningUntil && now >= new Date(tbl.cleaningUntil)) {
        tbl.status = 'Available';
        tbl.cleaningUntil = null;
        tbl.currentOrder = '';
        await tbl.save();
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayReservations = await Reservation.find({
      date: todayStr,
      status: { $in: ['Confirmed', 'Checked_In', 'Seated', 'Pending'] }
    }).sort({ updatedAt: -1 });

    const activeSessions = await TableSession.find({ status: 'ACTIVE' });

    const formattedTables = await Promise.all(tables.map(async (tbl) => {
      const cleanDigits = String(tbl.number || tbl.name || '').replace(/[^0-9]/g, '');
      const searchNums = [tbl.number, tbl.name];
      if (cleanDigits) {
        searchNums.push(`T-${cleanDigits.padStart(2, '0')}`);
        searchNums.push(`T-${cleanDigits}`);
        searchNums.push(cleanDigits);
        searchNums.push(String(parseInt(cleanDigits, 10)));
      }

      const activeResv = todayReservations.find(r => {
        if (!r.tableNo || r.tableNo === 'Unassigned') return false;
        const resvCleanDigits = String(r.tableNo).replace(/[^0-9]/g, '');
        if (searchNums.includes(r.tableNo)) return true;
        return Boolean(resvCleanDigits && cleanDigits && String(parseInt(resvCleanDigits, 10)) === String(parseInt(cleanDigits, 10)));
      });

      const activeSess = activeSessions.find(s => {
        const sessCleanDigits = String(s.tableNum).replace(/[^0-9]/g, '');
        if (searchNums.includes(s.tableNum)) return true;
        if (Array.isArray(s.mergedTableNums) && s.mergedTableNums.some(m => searchNums.includes(m))) return true;
        return Boolean(sessCleanDigits && cleanDigits && String(parseInt(sessCleanDigits, 10)) === String(parseInt(cleanDigits, 10)));
      });

      let currentStatus = tbl.status;
      if (activeResv && currentStatus === 'Available') {
        currentStatus = 'Reserved';
        tbl.status = 'Reserved';
        await tbl.save().catch(() => { });
      }

      const reservedDinerName = getBestDinerName(
        activeResv?.guestName,
        activeSess?.guestName,
        tbl?.guestName,
        tbl?.reservedBy,
        tbl?.customer
      );

      const tblObj = tbl.toObject ? tbl.toObject() : { ...tbl };
      tblObj.status = currentStatus;
      tblObj.reservation = activeResv || null;
      tblObj.reservedDinerName = reservedDinerName || (activeResv ? 'Valued Guest' : '');
      tblObj.guestName = reservedDinerName || (activeResv ? 'Valued Guest' : '');
      tblObj.customer = reservedDinerName || (activeResv ? 'Valued Guest' : '-');
      tblObj.guest = reservedDinerName || (activeResv ? 'Valued Guest' : '-');
      return tblObj;
    }));

    res.json(formattedTables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTableStatus = async (req, res) => {
  try {
    let status = req.body?.status;
    let currentOrder = req.body?.currentOrder || '';
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        status = parsed.status || parsed;
        currentOrder = parsed.currentOrder || '';
      } catch (e) {
        status = req.body;
      }
    }

    status = status || 'Available';
    const id = req.params.id;

    let updateData = { status, currentOrder: status === 'Available' ? '' : currentOrder };
    if (req.body?.assignedWaiterId !== undefined) updateData.assignedWaiterId = req.body.assignedWaiterId;
    if (req.body?.assignedWaiterName !== undefined) updateData.assignedWaiterName = req.body.assignedWaiterName;
    if (status === 'Cleaning') {
      // Set cleaning expiration to 10 minutes from now
      updateData.cleaningUntil = new Date(Date.now() + 10 * 60 * 1000);
      updateData.activeSessionId = null;
      updateData.currentOrder = '';
    } else if (status === 'Available') {
      updateData.cleaningUntil = null;
      updateData.currentOrder = '';
      updateData.activeSessionId = null;
    }

    let updated;
    if (typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
      updated = await Table.findByIdAndUpdate(id, updateData, { new: true });
    } else {
      const cleanNum = String(id).replace(/[^0-9]/g, '');
      const exactRegex = cleanNum ? new RegExp(`^(T-|Table\\s*)?0*${cleanNum}$`, 'i') : new RegExp(id, 'i');
      updated = await Table.findOneAndUpdate(
        { $or: [{ name: exactRegex }, { number: exactRegex }, { tableNumber: exactRegex }] },
        updateData,
        { new: true }
      );
    }

    if (!updated) {
      const cleanNum = String(id).replace(/[^0-9]/g, '') || '01';
      updated = await Table.create({
        number: `T-${cleanNum.padStart(2, '0')}`,
        name: `Table ${cleanNum}`,
        section: 'Main Dining',
        seats: 4,
        status: status,
        currentOrder: status === 'Available' ? '' : currentOrder
      });
    }

    if (updated) {
      const TableSession = require('../models/TableSession');
      const allNums = [updated.number, ...(updated.mergedWith || [])];

      if (updated.mergedWith && updated.mergedWith.length > 0) {
        await Table.updateMany({ number: { $in: updated.mergedWith } }, updateData);
      }

      if (status === 'Available' || status === 'Cleaning') {
        await TableSession.updateMany(
          { $or: [{ tableNum: { $in: allNums } }, { mergedTableNums: { $in: allNums } }], status: 'ACTIVE' },
          { status: 'CLOSED', closedAt: new Date() }
        );
      }
    }

    res.json(updated || { message: 'Table status updated' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateTableByNumber = async (req, res) => {
  try {
    let status = req.body?.status;
    let currentOrder = req.body?.currentOrder || '';
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        status = parsed.status || parsed;
        currentOrder = parsed.currentOrder || '';
      } catch (e) {
        status = req.body;
      }
    }

    status = status || 'Available';
    const rawNum = req.params.tableNum || '';
    const cleanNum = rawNum.toUpperCase().replace('TABLE', '').replace('T-', '').trim();
    const exactRegex = cleanNum ? new RegExp(`^(T-|Table\\s*)?0*${cleanNum}$`, 'i') : new RegExp(rawNum, 'i');

    let updateData = { status, currentOrder: status === 'Available' ? '' : currentOrder };
    if (req.body?.assignedWaiterId !== undefined) updateData.assignedWaiterId = req.body.assignedWaiterId;
    if (req.body?.assignedWaiterName !== undefined) updateData.assignedWaiterName = req.body.assignedWaiterName;
    if (status === 'Cleaning') {
      updateData.cleaningUntil = new Date(Date.now() + 10 * 60 * 1000);
      updateData.activeSessionId = null;
      updateData.currentOrder = '';
    } else if (status === 'Available') {
      updateData.cleaningUntil = null;
      updateData.currentOrder = '';
      updateData.activeSessionId = null;
    }

    let updated = await Table.findOneAndUpdate(
      { $or: [{ name: exactRegex }, { number: exactRegex }, { tableNumber: exactRegex }] },
      updateData,
      { new: true }
    );

    if (!updated) {
      updated = await Table.create({
        number: `T-${cleanNum.padStart(2, '0')}`,
        name: `Table ${cleanNum || rawNum}`,
        section: 'Main Dining',
        seats: 4,
        status: status,
        currentOrder: status === 'Available' ? '' : currentOrder
      });
    }

    if (updated && (status === 'Available' || status === 'Cleaning')) {
      const TableSession = require('../models/TableSession');
      const allNums = [cleanNum, `T-${cleanNum.padStart(2, '0')}`, rawNum, updated.number, ...(updated.mergedWith || [])];
      await TableSession.updateMany(
        {
          $or: [
            { tableNum: { $in: allNums } },
            { tableNum: exactRegex },
            { mergedTableNums: { $in: allNums } }
          ],
          status: 'ACTIVE'
        },
        { status: 'CLOSED', closedAt: new Date() }
      );
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Backend QR Code Generator using 'qrcode' package
const generateTableQr = async (req, res) => {
  try {
    const tableNum = req.body?.tableNum || req.params?.tableNum || 'T-01';

    // Resolve customer frontend base URL dynamically with priority to environment variables
    let frontendBase = process.env.FRONTEND_URL || process.env.CLIENT_URL || process.env.APP_URL;
    if (!frontendBase || frontendBase.trim() === '') {
      const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
      if (isLocalhost) {
        frontendBase = 'http://192.168.1.4:5173';
      } else {
        const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
        frontendBase = `${protocol}://${req.hostname}`;
      }
    }
    frontendBase = frontendBase.trim().replace(/\/+$/, '');

    const targetUrl = req.body?.targetUrl || `${frontendBase}/?table=${encodeURIComponent(tableNum)}`;

    // Generate base64 Data URL for table QR code
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      color: {
        dark: '#0F2A1D',
        light: '#FFFFFF'
      },
      width: 320,
      margin: 2
    });

    res.json({
      success: true,
      tableNum,
      targetUrl,
      qrDataUrl
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTable = async (req, res) => {
  try {
    const { number, name, section, zone, seats, cap, status } = req.body || {};
    const numVal = number || name || 'T-13';
    const sectionVal = section || zone || 'Main Dining';
    const seatsVal = Number(seats || cap || 4);

    const newTbl = await Table.create({
      number: numVal,
      name: numVal,
      section: sectionVal,
      seats: seatsVal,
      status: status || 'Available'
    });

    res.status(201).json(newTbl);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteTable = async (req, res) => {
  try {
    const id = req.params.id;
    let deleted;
    if (typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
      deleted = await Table.findByIdAndDelete(id);
    } else {
      const cleanNum = String(id).replace(/[^0-9]/g, '');
      const exactRegex = cleanNum ? new RegExp(`^(T-|Table\\s*)?0*${cleanNum}$`, 'i') : new RegExp(id, 'i');
      deleted = await Table.findOneAndDelete({ $or: [{ name: exactRegex }, { number: exactRegex }] });
    }
    res.json({ message: 'Table deleted successfully', deleted });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
const assignWaiter = async (req, res) => {
  try {
    const rawNum = req.params.tableNum || '';
    const cleanNum = rawNum.toUpperCase().replace('TABLE', '').replace('T-', '').trim();
    const exactRegex = cleanNum ? new RegExp(`^(T-|Table\\s*)?0*${cleanNum}$`, 'i') : new RegExp(rawNum, 'i');

    const waiterId = req.body.waiterId || (req.user ? req.user._id.toString() : '');
    const waiterName = req.body.waiterName || (req.user ? req.user.name : '');

    const updated = await Table.findOneAndUpdate(
      { $or: [{ number: exactRegex }, { name: exactRegex }] },
      { assignedWaiterId: waiterId, assignedWaiterName: waiterName },
      { new: true }
    );
    res.json(updated || { message: 'Table assigned' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getTables, createTable, updateTableStatus, updateTableByNumber, deleteTable, generateTableQr, assignWaiter };

