const Table = require('../models/Table');

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

module.exports = { getTables, updateTableStatus };
