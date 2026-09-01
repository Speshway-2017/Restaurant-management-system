const express = require('express');
const router = express.Router();
const { getTables, createTable, updateTableStatus, updateTableByNumber, deleteTable, generateTableQr } = require('../controllers/tableController');

router.get('/', getTables);
router.post('/', createTable);
router.post('/generate-qr', generateTableQr);
router.get('/qr/:tableNum', generateTableQr);
router.put('/number/:tableNum', updateTableByNumber);
router.put('/:id', updateTableStatus);
router.delete('/:id', deleteTable);

module.exports = router;
