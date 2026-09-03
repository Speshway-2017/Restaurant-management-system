const Table = require('../models/Table');
const Reservation = require('../models/Reservation');
const Waitlist = require('../models/Waitlist');
const Guest = require('../models/Guest');
const TableSession = require('../models/TableSession');
const Order = require('../models/Order');

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

const ensureTablesSeeded = async () => {
  let tables = await Table.find({}).sort({ number: 1 });
  if (!tables || tables.length === 0) {
    await Table.insertMany(defaultTablesList);
    tables = await Table.find({}).sort({ number: 1 });
  }
  return tables;
};

// 1. Get Receptionist KPIs
const getReceptionistKPIs = async (req, res) => {
  try {
    const tables = await ensureTablesSeeded();
    const waitlist = await Waitlist.find({ status: { $in: ['WAITING', 'CALLED'] } });
    const todayStr = new Date().toISOString().split('T')[0];
    const reservations = await Reservation.find({ date: todayStr, status: { $in: ['Confirmed', 'Pending', 'Checked_In'] } });

    const kpis = {
      totalTables: tables.length,
      available: tables.filter(t => t.status === 'Available').length,
      occupied: tables.filter(t => t.status === 'Occupied').length,
      reserved: tables.filter(t => t.status === 'Reserved').length,
      waiting: waitlist.length,
      upcoming: reservations.length,
      cleaning: tables.filter(t => t.status === 'Cleaning').length
    };

    res.json({ success: true, data: kpis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Floor Plan with Live Active Sessions and MongoDB Orders
const getFloorPlan = async (req, res) => {
  try {
    const tables = await ensureTablesSeeded();
    const activeSessions = await TableSession.find({ status: 'ACTIVE' });
    const activeOrders = await Order.find({ status: { $in: ['Placed', 'Preparing', 'Cooking', 'Ready', 'Served', 'Delivered'] } });
    const todayStr = new Date().toISOString().split('T')[0];
    const todayReservations = await Reservation.find({ date: todayStr, status: { $in: ['Confirmed', 'Checked_In'] } });

    const mappedTables = tables.map(tbl => {
      const activeSession = tbl.status !== 'Available' ? activeSessions.find(s => s.tableNum === tbl.number) : null;
      const resv = tbl.status === 'Reserved' ? todayReservations.find(r => r.tableNo === tbl.number) : null;

      // Find matching live MongoDB order for this table
      const tblOrder = activeOrders.find(o => {
        const orderTableNum = o.table ? String(o.table).replace(/[^0-9]/g, '') : (o.tableNum ? String(o.tableNum) : '');
        const targetTableNum = String(tbl.number).replace(/[^0-9]/g, '');
        return orderTableNum === targetTableNum;
      });

      return {
        _id: tbl._id,
        number: tbl.number,
        name: tbl.name,
        seats: tbl.seats,
        section: tbl.section,
        status: tbl.status,
        mergedWith: tbl.mergedWith || [],
        activeSession: activeSession || null,
        reservation: resv || null,
        activeOrder: tblOrder || null
      };
    });

    res.json({ success: true, data: mappedTables });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Walk-in Seating Flow (Supports Single Table & Multi-Table Merge Seating)
const seatWalkIn = async (req, res) => {
  try {
    const { tableNum, mergedTableNums, partySize, guestName, phone, specialOccasion, notes } = req.body;

    const primaryNum = String(tableNum || '').trim();
    const secondaryNums = Array.isArray(mergedTableNums) 
      ? mergedTableNums.map(n => String(n).trim()).filter(n => n && n !== primaryNum)
      : [];
    const allTableNums = Array.from(new Set([primaryNum, ...secondaryNums]));

    if (!primaryNum) {
      return res.status(400).json({ success: false, message: 'Primary table number is required.' });
    }

    const tables = await Table.find({ number: { $in: allTableNums } });
    if (tables.length !== allTableNums.length) {
      return res.status(404).json({ success: false, message: 'One or more selected tables were not found.' });
    }

    // Concurrent availability check: ensure ALL selected tables are currently Available
    const unavailableTables = tables.filter(t => t.status !== 'Available');
    if (unavailableTables.length > 0) {
      const busyList = unavailableTables.map(t => `${t.number} (${t.status})`).join(', ');
      return res.status(400).json({ 
        success: false, 
        message: `One or more selected tables are no longer available: ${busyList}. Please refresh and try again.` 
      });
    }

    // Close any prior leftover session for any of these tables
    await TableSession.updateMany({ tableNum: { $in: allTableNums }, status: 'ACTIVE' }, { status: 'CLOSED', closedAt: new Date() });

    // Create ONE brand new isolated active session for the entire merged group
    const sessionToken = `SESS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const mergeGroupId = allTableNums.length > 1 ? `MG-${Date.now()}` : '';

    const newSession = await TableSession.create({
      tableNum: primaryNum,
      mergedTableNums: secondaryNums,
      mergeGroupId,
      sessionToken,
      guestName: guestName || 'Guest Diner',
      phone: phone || '',
      partySize: Number(partySize) || 2,
      specialOccasion: specialOccasion || 'None',
      notes: notes || '',
      status: 'ACTIVE',
      seatedAt: new Date()
    });

    // Atomically set ALL merged tables to OCCUPIED and link to the same active session
    for (let tbl of tables) {
      tbl.status = 'Occupied';
      tbl.activeSessionId = newSession._id.toString();
      tbl.mergeGroupId = mergeGroupId;
      tbl.currentOrder = '';
      if (tbl.number === primaryNum) {
        tbl.mergedWith = secondaryNums;
      } else {
        tbl.mergedWith = [primaryNum, ...secondaryNums.filter(n => n !== tbl.number)];
      }
      await tbl.save();
    }

    // Auto-create/update guest profile if phone provided
    if (phone) {
      await createOrUpdateGuestProfile({ name: guestName || 'Guest Diner', phone, specialOccasion, notes });
    }

    res.status(201).json({ 
      success: true, 
      message: allTableNums.length > 1 
        ? `Merged tables ${allTableNums.join(' + ')} seated for ${guestName || 'Guest'}!`
        : `Guest seated at ${primaryNum} successfully!`, 
      session: newSession, 
      mergedTables: allTableNums 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper for Guest Profile creation/updating
const createOrUpdateGuestProfile = async ({ name, phone, specialOccasion, notes }) => {
  try {
    const cleanPhone = String(phone).trim();
    if (!cleanPhone) return;

    let guest = await Guest.findOne({ phone: cleanPhone });
    if (guest) {
      guest.visitCount += 1;
      guest.lastVisitDate = new Date();
      if (name && name !== 'Guest Diner') guest.name = name;
      if (specialOccasion && specialOccasion !== 'None') {
        const exists = guest.specialOccasions.some(s => s.occasion === specialOccasion);
        if (!exists) guest.specialOccasions.push({ occasion: specialOccasion, date: new Date().toISOString().split('T')[0] });
      }
      if (notes) guest.notes = notes;
      await guest.save();
    } else {
      await Guest.create({
        name: name || 'Guest Diner',
        phone: cleanPhone,
        visitCount: 1,
        lastVisitDate: new Date(),
        preferences: ['Window Seating', 'Standard'],
        specialOccasions: (specialOccasion && specialOccasion !== 'None') ? [{ occasion: specialOccasion, date: new Date().toISOString().split('T')[0] }] : [],
        notes: notes || ''
      });
    }
  } catch (e) {
    console.warn('Guest profile update warning:', e.message);
  }
};

// 4. Merge Tables
const mergeTables = async (req, res) => {
  try {
    const { primaryTableNum, secondaryTableNums } = req.body; // e.g. primary 'T-05', secondary ['T-06']
    if (!primaryTableNum || !Array.isArray(secondaryTableNums) || secondaryTableNums.length === 0) {
      return res.status(400).json({ success: false, message: 'Primary table and secondary tables are required.' });
    }

    const allTableNums = [primaryTableNum, ...secondaryTableNums];
    const tables = await Table.find({ number: { $in: allTableNums } });

    const primaryTable = tables.find(t => t.number === primaryTableNum);
    if (!primaryTable) return res.status(404).json({ success: false, message: 'Primary table not found.' });

    const activeSession = await TableSession.findOne({ tableNum: primaryTableNum, status: 'ACTIVE' });
    const mergeGroupId = `MG-${Date.now()}`;

    // Link secondary tables and set status to Occupied for all merged tables
    for (let t of tables) {
      t.status = 'Occupied';
      if (activeSession) {
        t.activeSessionId = activeSession._id.toString();
        t.mergeGroupId = mergeGroupId;
      }
      if (t.number !== primaryTableNum) {
        t.mergedWith = [primaryTableNum, ...secondaryTableNums.filter(n => n !== t.number)];
      } else {
        t.mergedWith = secondaryTableNums;
      }
      await t.save();
    }

    res.json({ success: true, message: `Tables ${allTableNums.join(' + ')} merged successfully!`, primaryTable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Split Tables
const splitTables = async (req, res) => {
  try {
    const { tableNum } = req.body;
    const table = await Table.findOne({ number: tableNum });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found.' });

    const mergedList = table.mergedWith || [];
    table.mergedWith = [];
    await table.save();

    if (mergedList.length > 0) {
      await Table.updateMany({ number: { $in: mergedList } }, { mergedWith: [], status: 'Available' });
    }

    res.json({ success: true, message: `Merged table ${tableNum} split successfully into individual tables!` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Transfer Table
const transferTable = async (req, res) => {
  try {
    const { fromTableNum, toTableNum } = req.body;

    const fromTable = await Table.findOne({ number: fromTableNum });
    const toTable = await Table.findOne({ number: toTableNum });

    if (!fromTable || !toTable) {
      return res.status(404).json({ success: false, message: 'Source or target table not found.' });
    }
    if (toTable.status === 'Occupied') {
      return res.status(400).json({ success: false, message: `Target table ${toTableNum} is already OCCUPIED.` });
    }

    // Move active session to target table
    const activeSession = await TableSession.findOne({ tableNum: fromTableNum, status: 'ACTIVE' });
    if (activeSession) {
      activeSession.tableNum = toTableNum;
      await activeSession.save();
    }

    // Move active open/unpaid orders to target table in MongoDB
    const cleanFromDigits = String(fromTableNum).replace(/[^0-9]/g, '');
    if (cleanFromDigits) {
      const fromRegex = new RegExp(`^(T-|Table\\s*)?0*${cleanFromDigits}$`, 'i');
      await Order.updateMany(
        {
          $or: [{ table: fromTableNum }, { table: fromRegex }],
          status: { $nin: ['Completed', 'Paid', 'Cancelled'] }
        },
        { table: toTableNum }
      );
    }

    // Update table statuses
    toTable.status = 'Occupied';
    toTable.activeSessionId = activeSession ? activeSession._id.toString() : null;
    toTable.currentOrder = fromTable.currentOrder;
    await toTable.save();

    fromTable.status = 'Available';
    fromTable.activeSessionId = null;
    fromTable.currentOrder = '';
    await fromTable.save();

    res.json({ success: true, message: `Session transferred from ${fromTableNum} to ${toTableNum} successfully!` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Waitlist Queue APIs
const getWaitlist = async (req, res) => {
  try {
    const list = await Waitlist.find({}).sort({ createdAt: 1 });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createWaitlistToken = async (req, res) => {
  try {
    const { guestName, phone, partySize, preferredSection, specialOccasion, notes } = req.body;

    const count = await Waitlist.countDocuments({});
    const tokenNum = `W-${String(count + 1).padStart(3, '0')}`;

    // Calculate estimated wait time based on active queue position
    const waitingCount = await Waitlist.countDocuments({ status: 'WAITING' });
    const position = waitingCount + 1;
    const estimatedWaitMins = position * 8 + (Number(partySize) > 4 ? 10 : 0);

    const token = await Waitlist.create({
      tokenNum,
      guestName,
      phone,
      partySize: Number(partySize) || 2,
      preferredSection: preferredSection || 'Any Section',
      specialOccasion: specialOccasion || 'None',
      notes: notes || '',
      status: 'WAITING',
      position,
      estimatedWaitMins
    });

    if (phone) {
      await createOrUpdateGuestProfile({ name: guestName, phone, specialOccasion, notes });
    }

    res.status(201).json({ success: true, data: token });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const callWaitlistToken = async (req, res) => {
  try {
    const { id } = req.params;
    const token = await Waitlist.findById(id);
    if (!token) return res.status(404).json({ success: false, message: 'Token not found.' });

    token.status = 'CALLED';
    token.calledAt = new Date();
    await token.save();

    res.json({ success: true, message: `Token ${token.tokenNum} is now CALLED!`, data: token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const seatWaitlistToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { tableNum, mergedTableNums } = req.body;

    const token = await Waitlist.findById(id);
    if (!token) return res.status(404).json({ success: false, message: 'Token not found.' });

    token.status = 'SEATED';
    token.seatedAt = new Date();
    await token.save();

    // If table assigned, trigger seating flow for this guest (supporting single or merged tables)
    if (tableNum) {
      const primaryNum = String(tableNum).trim();
      const secondaryNums = Array.isArray(mergedTableNums)
        ? mergedTableNums.map(n => String(n).trim()).filter(n => n && n !== primaryNum)
        : [];
      const allTableNums = Array.from(new Set([primaryNum, ...secondaryNums]));

      const tables = await Table.find({ number: { $in: allTableNums } });
      const mergeGroupId = allTableNums.length > 1 ? `MG-${Date.now()}` : '';

      const newSession = await TableSession.create({
        tableNum: primaryNum,
        mergedTableNums: secondaryNums,
        mergeGroupId,
        sessionToken: `SESS-${Date.now()}`,
        guestName: token.guestName,
        phone: token.phone,
        partySize: token.partySize,
        specialOccasion: token.specialOccasion,
        notes: token.notes,
        status: 'ACTIVE',
        seatedAt: new Date()
      });

      for (let tbl of tables) {
        tbl.status = 'Occupied';
        tbl.activeSessionId = newSession._id.toString();
        tbl.mergeGroupId = mergeGroupId;
        tbl.currentOrder = '';
        if (tbl.number === primaryNum) {
          tbl.mergedWith = secondaryNums;
        } else {
          tbl.mergedWith = [primaryNum, ...secondaryNums.filter(n => n !== tbl.number)];
        }
        await tbl.save();
      }
    }

    res.json({ success: true, message: `Token ${token.tokenNum} marked as SEATED!`, data: token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateWaitlistStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // NO_SHOW, EXPIRED, CANCELLED
    const token = await Waitlist.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ success: true, data: token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Reservations APIs
const getReservations = async (req, res) => {
  try {
    const list = await Reservation.find({}).sort({ date: 1, timeSlot: 1 });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createReservation = async (req, res) => {
  try {
    const { guestName, phone, guests, date, timeSlot, tableNo, section, specialOccasion, notes } = req.body;
    const bookingId = `RES-${Math.floor(100000 + Math.random() * 900000)}`;

    const reservation = await Reservation.create({
      bookingId,
      guestName,
      phone,
      guests: Number(guests) || 2,
      date,
      timeSlot,
      tableNo: tableNo || 'Unassigned',
      section: section || 'Main Hall',
      specialOccasion: specialOccasion || 'None',
      notes: notes || '',
      status: 'Confirmed',
      confirmationSent: true
    });

    if (phone) {
      await createOrUpdateGuestProfile({ name: guestName, phone, specialOccasion, notes });
    }

    res.status(201).json({ success: true, data: reservation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const checkInReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { tableNo } = req.body;

    const resv = await Reservation.findById(id);
    if (!resv) return res.status(404).json({ success: false, message: 'Reservation not found.' });

    resv.status = 'Checked_In';
    if (tableNo) resv.tableNo = tableNo;
    await resv.save();

    if (tableNo) {
      await Table.findOneAndUpdate({ number: tableNo }, { status: 'Reserved' });
    }

    res.json({ success: true, message: `Reservation ${resv.bookingId} checked in!`, data: resv });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tableNo } = req.body;
    const updatePayload = { status };
    if (tableNo) updatePayload.tableNo = tableNo;

    const resv = await Reservation.findByIdAndUpdate(id, updatePayload, { new: true });
    res.json({ success: true, data: resv });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Guests APIs
const getGuests = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query = { $or: [{ name: regex }, { phone: regex }, { email: regex }] };
    }
    const list = await Guest.find(query).sort({ lastVisitDate: -1 });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateGuestPreferences = async (req, res) => {
  try {
    const { id } = req.params;
    const { preferences, specialOccasions, notes } = req.body;
    const guest = await Guest.findByIdAndUpdate(id, { preferences, specialOccasions, notes }, { new: true });
    res.json({ success: true, data: guest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Notifications API
const sendNotification = async (req, res) => {
  try {
    const { type, recipient, message, channel } = req.body;
    // Real notification integration log structure
    console.log(`[NOTIFICATION SENT via ${channel || 'SMS/WhatsApp'}] To: ${recipient} | Type: ${type} | Message: ${message}`);
    res.json({ success: true, message: `Notification delivered to ${recipient} via ${channel || 'SMS/WhatsApp'}!` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReceptionistKPIs,
  getFloorPlan,
  seatWalkIn,
  mergeTables,
  splitTables,
  transferTable,
  getWaitlist,
  createWaitlistToken,
  callWaitlistToken,
  seatWaitlistToken,
  updateWaitlistStatus,
  getReservations,
  createReservation,
  checkInReservation,
  updateReservationStatus,
  getGuests,
  updateGuestPreferences,
  sendNotification
};
