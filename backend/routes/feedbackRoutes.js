const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getFeedbackList,
  getPublicFeedback,
  toggleLandingDisplay,
  deleteFeedback
} = require('../controllers/feedbackController');

router.post('/', submitFeedback);
router.get('/', getFeedbackList);
router.get('/public', getPublicFeedback);
router.patch('/:id/toggle-landing', toggleLandingDisplay);
router.delete('/:id', deleteFeedback);

module.exports = router;
