const Table = require('../models/Table');
const QRCode = require('qrcode');

const getTables = async (req, res) => {
  try {
    const tables = await Table.find({});
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTableStatus = async (req, res) => {
  try {
    const { status, currentOrder } = req.body;
    const updated = await Table.findByIdAndUpdate(req.params.id, { status, currentOrder }, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Backend QR Code Generator using 'qrcode' package
const generateTableQr = async (req, res) => {
  try {
    const tableNum = req.body?.tableNum || req.params?.tableNum || 'T-01';
    const targetUrl = req.body?.targetUrl || `http://localhost:5173/menu?table=${tableNum}`;
    
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

module.exports = { getTables, updateTableStatus, generateTableQr };
