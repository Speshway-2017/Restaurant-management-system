const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return successResponse(res, result, 'Login successful');
  } catch (error) {
    return errorResponse(res, error.message || 'Invalid email or password', 401);
  }
};

const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'Not authorized', 401);
    }
    return successResponse(res, {
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone || '',
        branch: req.user.branch || ''
      },
      role: req.user.role
    }, 'Session active');
  } catch (error) {
    return errorResponse(res, error.message || 'Not authorized', 401);
  }
};

const getProfile = async (req, res) => {
  try {
    const profile = await authService.getProfile(req.params.id);
    if (!profile) return errorResponse(res, 'User profile not found', 404);
    return successResponse(res, profile, 'Profile fetched successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { loginUser, getMe, getProfile };
