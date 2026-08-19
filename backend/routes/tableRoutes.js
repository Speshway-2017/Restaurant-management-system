const express = require('express');
const router = express.Router();
const { getTables, updateTableStatus, generateTableQr } = require('../controllers/tableController');

router.get('/', getTables);
router.post('/generate-qr', generateTableQr);
router.get('/qr/:tableNum', generateTableQr);
router.put('/:id', updateTableStatus);

module.exports = router;
