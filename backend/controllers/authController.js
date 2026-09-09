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
    const u = req.user;
    return successResponse(res, {
      user: {
        _id: u._id,
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone || '',
        branch: u.branch || 'Jubilee Hills (Main Branch)',
        empId: u.empId || (u.role && u.role.toLowerCase().includes('waiter') ? 'RMSW-01' : 'RMSM-01'),
        status: u.status || 'Active',
        department: u.department || 'Operations & Floor Management',
        joinedDate: u.joinedDate || '',
        checkInTime: u.checkInTime || '09:00 AM',
        checkOutTime: u.checkOutTime || '06:00 PM',
        scheduledShift: u.scheduledShift || '09:00 AM – 06:00 PM (Morning)',
        hoursLogged: u.hoursLogged || '8h 30m',
        attendanceStatus: u.attendanceStatus || 'Present',
        avatarUrl: u.avatarUrl || '',
        assignedTables: u.assignedTables || [],
        managerSettings: u.managerSettings || {}
      },
      role: u.role
    }, 'Session active');
  } catch (error) {
    return errorResponse(res, error.message || 'Not authorized', 401);
  }
};

const updateMe = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'Not authorized', 401);
    }
    const user = await authService.updateUser(req.user._id, req.body);
    const updatedPayload = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      branch: user.branch || 'Jubilee Hills (Main Branch)',
      empId: user.empId || (user.role && user.role.toLowerCase().includes('waiter') ? 'RMSW-01' : 'RMSM-01'),
      status: user.status || 'Active',
      department: user.department || 'Operations & Floor Management',
      joinedDate: user.joinedDate || '',
      checkInTime: user.checkInTime || '09:00 AM',
      checkOutTime: user.checkOutTime || '06:00 PM',
      scheduledShift: user.scheduledShift || '09:00 AM – 06:00 PM (Morning)',
      hoursLogged: user.hoursLogged || '8h 30m',
      attendanceStatus: user.attendanceStatus || 'Present',
      avatarUrl: user.avatarUrl || '',
      assignedTables: user.assignedTables || [],
      managerSettings: user.managerSettings || {}
    };
    return successResponse(res, {
      user: updatedPayload,
      ...updatedPayload
    }, 'Profile updated successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Error updating profile', 400);
  }
};

const getManagerSettings = async (req, res) => {
  try {
    if (!req.user) return errorResponse(res, 'Not authorized', 401);
    return successResponse(res, req.user.managerSettings || {}, 'Manager settings fetched');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const updateManagerSettings = async (req, res) => {
  try {
    if (!req.user) return errorResponse(res, 'Not authorized', 401);
    const updatedSettings = { ...(req.user.managerSettings || {}), ...req.body };
    req.user.managerSettings = updatedSettings;
    await req.user.save();
    return successResponse(res, req.user.managerSettings, 'Manager settings updated');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const getManagerNotifications = async (req, res) => {
  try {
    if (!req.user) return errorResponse(res, 'Not authorized', 401);
    const notifications = (req.user.notifications || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return successResponse(res, notifications, 'Manager notifications fetched');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    if (!req.user) return errorResponse(res, 'Not authorized', 401);
    if (Array.isArray(req.user.notifications)) {
      req.user.notifications.forEach(n => { n.read = true; });
      await req.user.save();
    }
    return successResponse(res, req.user.notifications || [], 'Notifications marked as read');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const getManagerActivities = async (req, res) => {
  try {
    if (!req.user) return errorResponse(res, 'Not authorized', 401);
    const activities = (req.user.activities || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return successResponse(res, activities, 'Manager activities fetched');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const addManagerActivity = async (req, res) => {
  try {
    if (!req.user) return errorResponse(res, 'Not authorized', 401);
    const { title, details, type, time } = req.body;
    if (!req.user.activities) req.user.activities = [];
    const newAct = {
      id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: title || 'Manager Action',
      details: details || '',
      type: type || 'action',
      time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actor: req.user.name,
      createdAt: new Date()
    };
    req.user.activities.unshift(newAct);
    if (req.user.activities.length > 50) req.user.activities = req.user.activities.slice(0, 50);
    await req.user.save();
    return successResponse(res, newAct, 'Activity recorded');
  } catch (error) {
    return errorResponse(res, error.message, 400);
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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return successResponse(res, result, 'Password reset OTP sent successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Error processing forgot password request', 400);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await authService.resetPassword(email, otp, newPassword);
    return successResponse(res, result, 'Password reset successful');
  } catch (error) {
    return errorResponse(res, error.message || 'Error resetting password', 400);
  }
};

module.exports = {
  loginUser,
  getMe,
  updateMe,
  getManagerSettings,
  updateManagerSettings,
  getManagerNotifications,
  markNotificationsRead,
  getManagerActivities,
  addManagerActivity,
  getProfile,
  forgotPassword,
  resetPassword
};
