const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/authMiddleware');
const { getStaff, createStaff, updateStaff, deleteStaff, checkPhoneExists } = require('../controllers/staffController');

router.use(optionalAuth);

router.get('/check-phone', checkPhoneExists);
router.get('/', getStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

module.exports = router;
