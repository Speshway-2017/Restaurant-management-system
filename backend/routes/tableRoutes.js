const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { getTables, createTable, updateTableStatus, updateTableByNumber, deleteTable, generateTableQr, assignWaiter } = require('../controllers/tableController');

router.use(optionalAuth);

router.get('/', getTables);
router.post('/', protect, createTable);
router.post('/generate-qr', protect, generateTableQr);
router.get('/qr/:tableNum', generateTableQr);
router.patch('/assign-waiter/:tableNum', protect, assignWaiter);
router.put('/number/:tableNum', protect, updateTableByNumber);
router.put('/:id', protect, updateTableStatus);
router.delete('/:id', protect, deleteTable);

module.exports = router;
