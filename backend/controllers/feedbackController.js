const Feedback = require('../models/Feedback');

const submitFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.create(req.body);
    return res.status(201).json({ success: true, data: feedback, message: 'Feedback submitted successfully' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getFeedbackList = async (req, res) => {
  try {
    const list = await Feedback.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitFeedback, getFeedbackList };
