const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return successResponse(res, result, 'Login successful');
  } catch (error) {
    return errorResponse(res, error.message, 401);
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

module.exports = { loginUser, getProfile };
