const express = require('express');
const router = express.Router();
const { getStaff, createStaff, deleteStaff } = require('../controllers/staffController');

router.get('/', getStaff);
router.post('/', createStaff);
router.delete('/:id', deleteStaff);

module.exports = router;
