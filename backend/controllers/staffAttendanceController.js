const StaffAttendance = require('../models/StaffAttendance');
const User = require('../models/User');
const { getIO } = require('../socket');

// Helper for formatting Asia/Kolkata (IST) dates and times
const getIstDetails = (dateObj = new Date()) => {
  const optionsDate = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
  const optionsTime = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true };
  const optionsFullDate = { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' };

  const parts = new Intl.DateTimeFormat('en-CA', optionsDate).format(dateObj); // YYYY-MM-DD
  const formattedTime = new Intl.DateTimeFormat('en-US', optionsTime).format(dateObj); // 09:32 AM
  const displayDate = new Intl.DateTimeFormat('en-GB', optionsFullDate).format(dateObj); // 05 Oct 2026

  return {
    dateStr: parts,
    formattedTime,
    displayDate
  };
};

const formatDuration = (start, end) => {
  if (!start || !end) return '0m';
  const diffMs = Math.max(0, new Date(end).getTime() - new Date(start).getTime());
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const normalizeRole = (roleStr = '') => {
  const clean = String(roleStr).toLowerCase().trim();
  if (clean.includes('chef')) return 'chef';
  if (clean.includes('waiter')) return 'waiter';
  if (clean.includes('reception') || clean.includes('host')) return 'receptionist';
  if (clean.includes('manager')) return 'manager';
  if (clean.includes('admin')) return 'admin';
  return 'staff';
};

// @desc    Staff Check IN (Duty Available)
// @route   POST /api/staff-attendance/in
// @access  Private (Staff)
exports.checkIn = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const staffId = user._id;
    const staffName = user.name || 'Staff Member';
    const empId = user.empId || `RMS-${String(staffId).slice(-4).toUpperCase()}`;
    const role = normalizeRole(user.role);

    // 1. Prevent duplicate active sessions
    let existingActiveSession = await StaffAttendance.findOne({
      staffId,
      status: 'available',
      logoutAt: null
    }).sort({ createdAt: -1 });

    if (existingActiveSession) {
      return res.status(400).json({
        success: false,
        message: 'Staff member is already checked in.',
        alreadyActive: true,
        attendance: existingActiveSession
      });
    }

    // 2. Create new attendance session
    const now = new Date();
    const { dateStr, formattedTime } = getIstDetails(now);

    const attendance = await StaffAttendance.create({
      staffId,
      staffName,
      empId,
      role,
      loginAt: now,
      logoutAt: null,
      status: 'available',
      date: dateStr,
      loginTimeFormatted: formattedTime,
      logoutTimeFormatted: ''
    });

    // 3. Update User document fields
    try {
      await User.findByIdAndUpdate(staffId, {
        attendanceStatus: 'Present',
        status: 'Active'
      });
    } catch (e) { }

    // 4. Emit real-time socket event
    const io = getIO();
    if (io) {
      const socketPayload = {
        staffId: String(staffId),
        staffName,
        empId,
        role,
        status: 'available',
        loginAt: now,
        logoutAt: null,
        loginTimeFormatted: formattedTime,
        attendanceId: String(attendance._id)
      };
      io.emit('staffAvailabilityUpdated', socketPayload);
      io.emit('staff_attendance_updated', socketPayload);
    }

    return res.status(201).json({
      success: true,
      message: 'Check IN recorded successfully',
      attendance
    });
  } catch (error) {
    console.error('Check IN error:', error);
    return res.status(500).json({ success: false, message: 'Server error recording Check IN', error: error.message });
  }
};

// @desc    Staff Check OUT (Duty Offline)
// @route   POST /api/staff-attendance/out
// @access  Private (Staff)
exports.checkOut = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const staffId = user._id;
    const now = new Date();
    const { dateStr, formattedTime } = getIstDetails(now);

    // 1. Find active open session
    let session = await StaffAttendance.findOne({
      staffId,
      status: 'available',
      logoutAt: null
    }).sort({ createdAt: -1 });

    if (!session) {
      return res.status(400).json({
        success: false,
        message: 'No active attendance session found.'
      });
    }

    // 2. Update session with logout details
    const loginAtDate = session.loginAt || now;
    const diffMs = Math.max(0, now.getTime() - new Date(loginAtDate).getTime());
    const durationMinutes = Math.floor(diffMs / 60000);
    const durationFormatted = formatDuration(loginAtDate, now);

    session.logoutAt = now;
    session.logoutTimeFormatted = formattedTime;
    session.status = 'offline';
    session.durationMinutes = durationMinutes;
    session.durationFormatted = durationFormatted;
    await session.save();

    // 3. Update User document fields
    try {
      await User.findByIdAndUpdate(staffId, {
        attendanceStatus: 'Offline',
        hoursLogged: durationFormatted
      });
    } catch (e) { }

    // 4. Emit real-time socket event
    const io = getIO();
    if (io) {
      const socketPayload = {
        staffId: String(staffId),
        staffName: session.staffName,
        empId: session.empId,
        role: session.role,
        status: 'offline',
        loginAt: session.loginAt,
        logoutAt: now,
        logoutTimeFormatted: formattedTime,
        durationFormatted,
        attendanceId: String(session._id)
      };
      io.emit('staffAvailabilityUpdated', socketPayload);
      io.emit('staff_attendance_updated', socketPayload);
    }

    return res.status(200).json({
      success: true,
      message: 'Check OUT recorded successfully',
      attendance: session
    });
  } catch (error) {
    console.error('Check OUT error:', error);
    return res.status(500).json({ success: false, message: 'Server error recording Check OUT', error: error.message });
  }
};

// @desc    Get Current Real-Time Staff Availability
// @route   GET /api/staff-attendance/current
// @access  Private (Manager/Admin)
exports.getCurrentAvailability = async (req, res) => {
  try {
    // Fetch operational staff users ONLY (Chef, Waiter, Receptionist). Strictly exclude Manager & Admin.
    const staffUsers = await User.find({
      role: { $nin: ['Admin', 'admin', 'Manager', 'manager', 'Resto Manager', 'resto manager', 'Super Admin', 'super admin'] }
    }).select('-password').lean();

    const now = new Date();
    const todayStr = getIstDetails(now).dateStr;

    const resultList = await Promise.all(staffUsers.map(async (u) => {
      const uRole = normalizeRole(u.role);
      
      // Find latest attendance session for this staff member
      const latestSession = await StaffAttendance.findOne({ staffId: u._id }).sort({ createdAt: -1 }).lean();

      // Active status means latest session exists, has status 'available', and logoutAt is null
      const isAvailable = Boolean(latestSession && latestSession.status === 'available' && !latestSession.logoutAt);

      // Check if latest session belongs to TODAY in IST
      const isTodaySession = Boolean(latestSession && latestSession.date === todayStr);

      // Find all sessions recorded TODAY for calculating total duration logged today
      const todaySessions = await StaffAttendance.find({
        staffId: u._id,
        date: todayStr
      }).lean();

      let totalMinsToday = 0;
      todaySessions.forEach(s => {
        if (s.logoutAt) {
          const diff = Math.max(0, new Date(s.logoutAt).getTime() - new Date(s.loginAt).getTime());
          totalMinsToday += (s.durationMinutes && s.durationMinutes > 0) ? s.durationMinutes : Math.floor(diff / 60000);
        } else if (s.loginAt) {
          const diff = Math.max(0, now.getTime() - new Date(s.loginAt).getTime());
          totalMinsToday += Math.floor(diff / 60000);
        }
      });

      const hoursToday = Math.floor(totalMinsToday / 60);
      const minsToday = totalMinsToday % 60;
      let hoursLoggedFormatted = '0m';
      if (hoursToday > 0 && minsToday > 0) {
        hoursLoggedFormatted = `${hoursToday}h ${minsToday}m`;
      } else if (hoursToday > 0) {
        hoursLoggedFormatted = `${hoursToday}h`;
      } else if (minsToday > 0) {
        hoursLoggedFormatted = `${minsToday}m`;
      }

      // Format Check IN and Check OUT times using actual attendance timestamps ONLY
      let loginTimeFormatted = '—';
      let logoutTimeFormatted = '—';

      if (isTodaySession && latestSession) {
        loginTimeFormatted = latestSession.loginTimeFormatted || (latestSession.loginAt ? getIstDetails(new Date(latestSession.loginAt)).formattedTime : '—');
        logoutTimeFormatted = isAvailable ? 'Currently Active' : (latestSession.logoutTimeFormatted || (latestSession.logoutAt ? getIstDetails(new Date(latestSession.logoutAt)).formattedTime : '—'));
      }

      return {
        id: String(u._id),
        staffId: String(u._id),
        name: u.name,
        empId: u.empId || `RMS-${String(u._id).slice(-4).toUpperCase()}`,
        role: u.role,
        normRole: uRole,
        email: u.email,
        phone: u.phone,
        status: isAvailable ? 'available' : 'offline',
        loginTimeFormatted,
        logoutTimeFormatted,
        loginAt: (isTodaySession && latestSession) ? latestSession.loginAt : null,
        logoutAt: (isTodaySession && latestSession) ? latestSession.logoutAt : null,
        totalWorkingHoursToday: hoursLoggedFormatted,
        loggedTodayMinutes: totalMinsToday,
        activeSession: isAvailable,
        lastSession: latestSession || null
      };
    }));

    // Summary Counts
    const totalStaff = resultList.length;
    const availableChefs = resultList.filter(s => s.normRole === 'chef' && s.status === 'available').length;
    const availableWaiters = resultList.filter(s => s.normRole === 'waiter' && s.status === 'available').length;
    const offlineStaff = resultList.filter(s => s.status === 'offline').length;

    return res.status(200).json({
      success: true,
      summary: {
        totalStaff,
        availableChefs,
        availableWaiters,
        offlineStaff
      },
      staff: resultList
    });
  } catch (error) {
    console.error('Get current availability error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching availability', error: error.message });
  }
};

// @desc    Get Staff Attendance History
// @route   GET /api/staff-attendance/history
// @access  Private (Manager/Admin)
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { date, role, staffId, status, search } = req.query;

    const query = {
      role: { $nin: ['manager', 'admin', 'resto manager', 'super admin'] }
    };
    if (date && String(date).trim()) {
      query.date = String(date).trim();
    }
    if (role && role !== 'All') {
      query.role = normalizeRole(role);
    }
    if (staffId) {
      query.staffId = staffId;
    }
    if (status && status !== 'All') {
      query.status = String(status).toLowerCase();
    }
    if (search && search.trim()) {
      query.staffName = { $regex: search.trim(), $options: 'i' };
    }

    let sessions = await StaffAttendance.find(query).sort({ createdAt: -1 }).limit(200).lean();
    const now = new Date();
    const { dateStr } = getIstDetails(now);

    // Build operational staff roster query
    let userQuery = {
      role: { $nin: ['Admin', 'admin', 'Manager', 'manager', 'Resto Manager', 'resto manager', 'Super Admin', 'super admin'] }
    };
    if (role && role !== 'All') {
      const normR = normalizeRole(role);
      userQuery.role = { $regex: normR, $options: 'i' };
    }
    if (search && search.trim()) {
      userQuery.name = { $regex: search.trim(), $options: 'i' };
    }
    if (staffId) {
      userQuery._id = staffId;
    }

    const staffUsers = await User.find(userQuery).select('-password').lean();
    const existingStaffIds = new Set(sessions.map(s => String(s.staffId)));

    // For any operational staff member who doesn't have a recorded session for this query, append their roster entry
    staffUsers.forEach((u) => {
      const uIdStr = String(u._id);
      if (!existingStaffIds.has(uIdStr)) {
        const uRole = normalizeRole(u.role);
        const userStatus = 'offline';

        if (status && status !== 'All') {
          const reqStat = String(status).toLowerCase();
          if (reqStat === 'available') return;
        }

        sessions.push({
          _id: u._id,
          staffId: u._id,
          staffName: u.name,
          empId: u.empId || `RMS-${String(u._id).slice(-4).toUpperCase()}`,
          role: uRole,
          date: date || dateStr,
          loginAt: null,
          logoutAt: null,
          loginTimeFormatted: '—',
          logoutTimeFormatted: '—',
          status: userStatus,
          durationMinutes: 0,
          durationFormatted: '0m'
        });
      }
    });

    const formattedSessions = sessions.map(s => {
      const isCurrentlyActive = s.status === 'available' && !s.logoutAt;
      let durationStr = s.durationFormatted || '0m';

      if (isCurrentlyActive && s.loginAt) {
        durationStr = formatDuration(s.loginAt, now) + ' (Active)';
      } else if (isCurrentlyActive) {
        durationStr = 'Active';
      }

      const sessionDate = s.loginAt || now;
      const { displayDate } = getIstDetails(new Date(sessionDate));

      return {
        id: String(s._id || s.id),
        staffId: String(s.staffId),
        staffName: s.staffName,
        empId: s.empId || '',
        role: s.role,
        date: s.date,
        displayDate: displayDate,
        loginAt: s.loginAt,
        logoutAt: s.logoutAt,
        loginTimeFormatted: s.loginTimeFormatted || '—',
        logoutTimeFormatted: isCurrentlyActive ? 'Currently Active' : (s.logoutTimeFormatted || '—'),
        status: s.status,
        durationFormatted: durationStr
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedSessions.length,
      history: formattedSessions
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching history', error: error.message });
  }
};

// @desc    Get My Active Check-In Status
// @route   GET /api/staff-attendance/my-status
// @access  Private (Staff)
exports.getMyStatus = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const activeSession = await StaffAttendance.findOne({
      staffId: user._id,
      status: 'available',
      logoutAt: null
    }).sort({ createdAt: -1 }).lean();

    const latestSession = await StaffAttendance.findOne({
      staffId: user._id
    }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      status: activeSession ? 'available' : 'offline',
      dutyStatus: activeSession ? 'LOGGED_IN' : 'LOGGED_OUT',
      activeSession: activeSession || null,
      lastSession: latestSession || null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error checking status', error: error.message });
  }
};
