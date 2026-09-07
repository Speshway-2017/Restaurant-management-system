const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/authMiddleware');
const { getTables, createTable, updateTableStatus, updateTableByNumber, deleteTable, generateTableQr, assignWaiter } = require('../controllers/tableController');

router.use(optionalAuth);

router.get('/', getTables);
router.post('/', createTable);
router.post('/generate-qr', generateTableQr);
router.get('/qr/:tableNum', generateTableQr);
router.patch('/assign-waiter/:tableNum', assignWaiter);
router.put('/number/:tableNum', updateTableByNumber);
router.put('/:id', updateTableStatus);
router.delete('/:id', deleteTable);

module.exports = router;
