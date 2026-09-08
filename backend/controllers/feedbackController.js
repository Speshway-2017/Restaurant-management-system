const Feedback = require('../models/Feedback');

const submitFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.create({
      ...req.body,
      showOnLanding: false
    });
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

const getPublicFeedback = async (req, res) => {
  try {
    const list = await Feedback.find({ showOnLanding: true }).sort({ createdAt: -1 }).limit(20);
    return res.json({ success: true, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleLandingDisplay = async (req, res) => {
  try {
    const { id } = req.params;
    const { showOnLanding } = req.body;
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }
    feedback.showOnLanding = typeof showOnLanding === 'boolean' ? showOnLanding : !feedback.showOnLanding;
    await feedback.save();
    return res.json({ success: true, data: feedback, message: 'Landing display updated' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    await Feedback.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitFeedback,
  getFeedbackList,
  getPublicFeedback,
  toggleLandingDisplay,
  deleteFeedback
};
