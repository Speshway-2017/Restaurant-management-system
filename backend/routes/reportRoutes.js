const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/analytics', reportController.getReportAnalytics);
router.get('/branches', reportController.getReportBranches);

module.exports = router;
