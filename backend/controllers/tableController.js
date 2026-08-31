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

    res.json(tables);
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
    if (status === 'Cleaning') {
      // Set cleaning expiration to 10 minutes from now
      updateData.cleaningUntil = new Date(Date.now() + 10 * 60 * 1000);
    } else if (status === 'Available') {
      updateData.cleaningUntil = null;
      updateData.currentOrder = '';
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
    if (status === 'Cleaning') {
      updateData.cleaningUntil = new Date(Date.now() + 10 * 60 * 1000);
    } else if (status === 'Available') {
      updateData.cleaningUntil = null;
      updateData.currentOrder = '';
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

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Backend QR Code Generator using 'qrcode' package
const generateTableQr = async (req, res) => {
  try {
    const tableNum = req.body?.tableNum || req.params?.tableNum || 'T-01';
    const defaultHost = (req.hostname === 'localhost' || req.hostname === '127.0.0.1') ? '192.168.1.34' : req.hostname;
    const targetUrl = req.body?.targetUrl || `http://${defaultHost}:5173/menu?table=${tableNum}`;
    
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

module.exports = { getTables, updateTableStatus, updateTableByNumber, generateTableQr };
