const express = require('express');
const router = express.Router();
const { getTables, updateTableStatus } = require('../controllers/tableController');

router.get('/', getTables);
router.put('/:id', updateTableStatus);

module.exports = router;
