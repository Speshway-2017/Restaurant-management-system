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

const normalizeToIstDateStr = (dateVal, loginAtObj) => {
  if (loginAtObj) {
    try {
      const d = new Date(loginAtObj);
      if (!isNaN(d.getTime())) {
        return getIstDetails(d).dateStr;
      }
    } catch (e) {}
  }
  if (!dateVal) return getIstDetails(new Date()).dateStr;
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    return getIstDetails(dateVal).dateStr;
  }

  const str = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  const ddmmyyyy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
  }

  const yyyymmdd = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (yyyymmdd) {
    return `${yyyymmdd[1]}-${yyyymmdd[2].padStart(2, '0')}-${yyyymmdd[3].padStart(2, '0')}`;
  }

  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return getIstDetails(parsed).dateStr;
    }
  } catch (e) {}

  return str;
};

// @desc    Staff Check IN (Duty Available)
// @route   POST /api/staff-attendance/in
// @access  Private (Staff)
exports.checkIn = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      console.warn('[Attendance] Check IN attempt failed: User not authenticated');
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const staffId = user._id;
    const staffName = user.name || 'Staff Member';
    const empId = user.empId || `RMS-${String(staffId).slice(-4).toUpperCase()}`;
    const role = normalizeRole(user.role);

    console.log(`[Attendance] Check IN request received`);
    console.log(`[Attendance] Authenticated user: ${staffName} (${staffId})`);
    console.log(`[Attendance] Role: ${role}`);

    // 1. Prevent duplicate active sessions by returning active state instead of failing
    let existingActiveSession = await StaffAttendance.findOne({
      staffId,
      status: 'available',
      logoutAt: null
    }).sort({ createdAt: -1 });

    if (existingActiveSession) {
      console.log(`[Attendance] User ${staffName} is already checked in. Returning active session.`);
      return res.status(200).json({
        success: true,
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

    console.log(`[Attendance] Attendance record created: ID=${attendance._id}, Staff=${staffName}, Status=available`);

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
        type: 'CHECK_IN',
        staffId: String(staffId),
        staffName,
        empId,
        role: user.role || role,
        normRole: role,
        status: 'available',
        action: 'checkIn',
        timestamp: now.toISOString(),
        loginAt: now,
        logoutAt: null,
        loginTimeFormatted: formattedTime,
        logoutTimeFormatted: 'Currently Active',
        durationMinutes: 0,
        durationFormatted: '0m',
        date: dateStr,
        attendanceId: String(attendance._id)
      };
      io.emit('staffAvailabilityUpdated', socketPayload);
      io.emit('staff_attendance_updated', socketPayload);
      io.emit('staffAttendanceUpdated', socketPayload);
      console.log(`[Attendance] staffAttendanceUpdated emitted for ${staffName} (${role}): AVAILABLE`);
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
      console.warn('[Attendance] Check OUT attempt failed: User not authenticated');
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const staffId = user._id;
    const staffName = user.name || 'Staff Member';
    const role = normalizeRole(user.role);

    console.log(`[Attendance] Check OUT request received`);
    console.log(`[Attendance] Authenticated user: ${staffName} (${staffId})`);
    console.log(`[Attendance] Role: ${role}`);

    const now = new Date();
    const { dateStr, formattedTime } = getIstDetails(now);

    // 1. Find active open session
    let session = await StaffAttendance.findOne({
      staffId,
      status: 'available',
      logoutAt: null
    }).sort({ createdAt: -1 });

    if (!session) {
      console.warn(`[Attendance] Check OUT failed: No active attendance session found for ${staffName}`);
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

    console.log(`[Attendance] Attendance record updated: ID=${session._id}, Staff=${staffName}, Status=offline, Duration=${durationFormatted}`);

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
        type: 'CHECK_OUT',
        staffId: String(staffId),
        staffName: session.staffName,
        empId: session.empId,
        role: user.role || session.role,
        normRole: role,
        status: 'offline',
        action: 'checkOut',
        timestamp: now.toISOString(),
        loginAt: session.loginAt,
        logoutAt: now,
        loginTimeFormatted: session.loginTimeFormatted || (session.loginAt ? getIstDetails(new Date(session.loginAt)).formattedTime : '—'),
        logoutTimeFormatted: formattedTime,
        durationMinutes,
        durationFormatted,
        date: session.date || dateStr,
        attendanceId: String(session._id)
      };
      io.emit('staffAvailabilityUpdated', socketPayload);
      io.emit('staff_attendance_updated', socketPayload);
      io.emit('staffAttendanceUpdated', socketPayload);
      console.log(`[Attendance] staffAttendanceUpdated emitted for ${staffName} (${role}): OFFLINE`);
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

      // Active status means latest session exists, has status 'available', and logoutAt is null, OR user status is Active / Present
      const isAvailable = Boolean(
        (latestSession && latestSession.status === 'available' && !latestSession.logoutAt) ||
        (u.attendanceStatus === 'Present' && u.status === 'Active')
      );

      // Check if latest session belongs to TODAY in IST
      const isTodaySession = Boolean(latestSession && normalizeToIstDateStr(latestSession.date, latestSession.loginAt) === todayStr);

      // Find all sessions recorded TODAY for calculating total duration logged today
      const allStaffSessions = await StaffAttendance.find({ staffId: u._id }).lean();
      const todaySessions = allStaffSessions.filter(s => normalizeToIstDateStr(s.date, s.loginAt) === todayStr);

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
    const availableChefs = resultList.filter(s => (s.normRole === 'chef' || String(s.role || '').toLowerCase().includes('chef')) && s.status === 'available').length;
    const availableWaiters = resultList.filter(s => (s.normRole === 'waiter' || String(s.role || '').toLowerCase().includes('waiter')) && s.status === 'available').length;
    const availableReceptionists = resultList.filter(s => (s.normRole === 'receptionist' || String(s.role || '').toLowerCase().includes('reception') || String(s.role || '').toLowerCase().includes('host')) && s.status === 'available').length;
    const offlineStaff = resultList.filter(s => s.status === 'offline').length;

    return res.status(200).json({
      success: true,
      summary: {
        totalStaff,
        availableChefs,
        availableWaiters,
        availableReceptionists,
        offlineStaff
      },
      staff: resultList
    });
  } catch (error) {
    console.error('Get current availability error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching availability', error: error.message });
  }
};

// @desc    Get Staff Attendance History (Grouped by Staff Member + IST Date)
// @route   GET /api/staff-attendance/history
// @access  Private (Manager/Admin)
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { date, role, staffId, status, search, month } = req.query;
    const now = new Date();
    const { dateStr } = getIstDetails(now);

    const mongoose = require('mongoose');

    // 1. Safely resolve staffId (handle Mongo ObjectId, empId, or string id)
    let targetStaffId = null;
    let targetUserObj = null;
    if (staffId && String(staffId).trim() !== '' && String(staffId).trim().toLowerCase() !== 'undefined' && String(staffId).trim().toLowerCase() !== 'null') {
      const trimmed = String(staffId).trim();
      if (mongoose.Types.ObjectId.isValid(trimmed)) {
        targetStaffId = trimmed;
        targetUserObj = await User.findById(trimmed).select('_id empId name').lean();
      }
      if (!targetUserObj) {
        const queryOr = [
          { empId: trimmed },
          { empId: { $regex: new RegExp(trimmed + '$', 'i') } },
          { name: { $regex: new RegExp(trimmed, 'i') } }
        ];
        if (mongoose.Types.ObjectId.isValid(trimmed)) {
          queryOr.unshift({ _id: trimmed });
        }
        targetUserObj = await User.findOne({ $or: queryOr }).select('_id empId name').lean();
        if (targetUserObj) {
          targetStaffId = String(targetUserObj._id);
        }
      }
    }

    const isSpecificDate = date && String(date).trim() !== '' && String(date).trim().toLowerCase() !== 'all';
    const monthStr = month && String(month).trim() !== '' && String(month).trim().toLowerCase() !== 'all' ? String(month).trim() : null;

    let targetQueryDate = null;
    if (isSpecificDate) {
      targetQueryDate = normalizeToIstDateStr(String(date).trim());
    } else if (!monthStr && !targetStaffId) {
      targetQueryDate = dateStr;
    }

    // 2. Build MongoDB query
    const andConditions = [
      { role: { $nin: ['manager', 'admin', 'resto manager', 'super admin'] } }
    ];

    if (targetStaffId) {
      const staffConditions = [
        { staffId: targetStaffId },
        { staffId: String(targetStaffId) }
      ];
      if (mongoose.Types.ObjectId.isValid(targetStaffId)) {
        staffConditions.push({ staffId: new mongoose.Types.ObjectId(targetStaffId) });
      }
      if (targetUserObj) {
        if (targetUserObj.empId) {
          staffConditions.push({ empId: targetUserObj.empId });
        }
        if (targetUserObj.name) {
          const escapedName = targetUserObj.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          staffConditions.push({ staffName: { $regex: new RegExp('^' + escapedName + '$', 'i') } });
        }
      }
      andConditions.push({ $or: staffConditions });
    }

    if (targetQueryDate) {
      const parts = targetQueryDate.split('-');
      let altDateStr = targetQueryDate;
      if (parts.length === 3 && parts[0].length === 4) {
        altDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
      }
      andConditions.push({
        $or: [
          { date: targetQueryDate },
          { date: altDateStr }
        ]
      });
    } else if (monthStr) {
      const [mYear, mNum] = monthStr.split('-');
      const monthInt = parseInt(mNum, 10);
      const yearInt = parseInt(mYear, 10);
      const mNumPad = String(monthInt).padStart(2, '0');

      const daysInMonth = new Date(yearInt, monthInt, 0).getDate();
      const startDateStr = `${mYear}-${mNumPad}-01`;
      const endDateStr = `${mYear}-${mNumPad}-${String(daysInMonth).padStart(2, '0')}`;

      const altMonthStr = `${mNumPad}-${mYear}`;
      const altMonthStr2 = `${monthInt}-${mYear}`;

      const startOfMonth = new Date(Date.UTC(yearInt, monthInt - 1, 1, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(yearInt, monthInt, 0, 23, 59, 59, 999));

      andConditions.push({
        $or: [
          { date: { $gte: startDateStr, $lte: endDateStr } },
          { date: { $regex: new RegExp('^' + monthStr) } },
          { date: { $regex: new RegExp('-' + altMonthStr + '$') } },
          { date: { $regex: new RegExp('-' + altMonthStr2 + '$') } },
          { loginAt: { $gte: startOfMonth, $lte: endOfMonth } }
        ]
      });
    }

    if (role && role !== 'All') {
      andConditions.push({ role: normalizeRole(role) });
    }
    if (search && search.trim()) {
      andConditions.push({ staffName: { $regex: search.trim(), $options: 'i' } });
    }

    const query = { $and: andConditions };

    const rawSessions = await StaffAttendance.find(query).sort({ createdAt: 1 }).limit(2000).lean();

    // 2. Fetch ALL operational staff (Left Join master roster: Waiter, Chef, Receptionist)
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
    if (targetStaffId) {
      userQuery._id = targetStaffId;
    }

    const staffUsers = await User.find(userQuery).select('-password').lean();

    const userByIdMap = new Map();
    const userByEmpIdMap = new Map();
    const userByNameMap = new Map();

    staffUsers.forEach(u => {
      const uId = String(u._id);
      userByIdMap.set(uId, u);
      if (u.empId) userByEmpIdMap.set(String(u.empId).toUpperCase(), u);
      if (u.name) userByNameMap.set(String(u.name).toLowerCase().trim(), u);
    });

    // Group raw sessions by canonical staffId and normalized IST date (YYYY-MM-DD)
    const groupedMap = new Map();

    rawSessions.forEach(s => {
      const sDate = normalizeToIstDateStr(s.date, s.loginAt);
      const sStaffIdStr = String(s.staffId);
      const sEmpIdStr = String(s.empId || '').toUpperCase();
      const sNameStr = String(s.staffName || '').toLowerCase().trim();

      const matchedUser = userByIdMap.get(sStaffIdStr) || 
                          userByEmpIdMap.get(sEmpIdStr) || 
                          userByNameMap.get(sNameStr);

      const canonicalStaffId = targetStaffId || (matchedUser ? String(matchedUser._id) : sStaffIdStr);
      const canonicalStaffName = matchedUser ? matchedUser.name : (s.staffName || 'Staff Member');
      const canonicalEmpId = matchedUser ? (matchedUser.empId || `RMS-${canonicalStaffId.slice(-4).toUpperCase()}`) : (s.empId || '');
      const canonicalRole = matchedUser ? normalizeRole(matchedUser.role) : normalizeRole(s.role);

      const key = `${canonicalStaffId}_${sDate}`;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          staffId: canonicalStaffId,
          staffName: canonicalStaffName,
          empId: canonicalEmpId,
          role: canonicalRole,
          date: sDate,
          rawList: []
        });
      }
      groupedMap.get(key).rawList.push(s);
    });

    // Ensure operational staff users appear for the requested date if a single target date is specified
    if (targetQueryDate) {
      staffUsers.forEach((u) => {
        const uIdStr = String(u._id);
        const key = `${uIdStr}_${targetQueryDate}`;
        if (!groupedMap.has(key)) {
          groupedMap.set(key, {
            staffId: uIdStr,
            staffName: u.name,
            empId: u.empId || `RMS-${uIdStr.slice(-4).toUpperCase()}`,
            role: normalizeRole(u.role),
            date: targetQueryDate,
            rawList: []
          });
        }
      });
    }

    // Populate all calendar dates for target staff member when month view is requested
    if (monthStr && targetStaffId) {
      const [mYear, mNum] = monthStr.split('-');
      const monthInt = parseInt(mNum, 10);
      const yearInt = parseInt(mYear, 10);
      const daysInMonth = new Date(yearInt, monthInt, 0).getDate();
      const mNumPad = String(monthInt).padStart(2, '0');

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = `${mYear}-${mNumPad}-${String(day).padStart(2, '0')}`;
        const key = `${targetStaffId}_${dayStr}`;
        if (!groupedMap.has(key)) {
          const matchedU = targetUserObj || userByIdMap.get(targetStaffId);
          groupedMap.set(key, {
            staffId: targetStaffId,
            staffName: matchedU ? matchedU.name : (targetUserObj ? targetUserObj.name : 'Staff Member'),
            empId: matchedU ? (matchedU.empId || `RMS-${targetStaffId.slice(-4).toUpperCase()}`) : '',
            role: matchedU ? normalizeRole(matchedU.role) : 'staff',
            date: dayStr,
            rawList: []
          });
        }
      }
    }

    // 3. Aggregate each staff member's sessions and status
    const aggregatedRecords = Array.from(groupedMap.values()).map(group => {
      let formattedDisplayDate = group.date;
      try {
        const parts = String(group.date).split('-');
        if (parts.length === 3) {
          const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          formattedDisplayDate = getIstDetails(dObj).displayDate;
        }
      } catch (e) {}
      const sessionsList = group.rawList.sort((a, b) => {
        const tA = a.loginAt ? new Date(a.loginAt).getTime() : 0;
        const tB = b.loginAt ? new Date(b.loginAt).getTime() : 0;
        return tA - tB;
      });

      let totalDurationMinutes = 0;
      let hasActiveSession = false;

      const formattedSessions = sessionsList.map(s => {
        const isCurrentlyActive = s.status === 'available' && !s.logoutAt;
        if (isCurrentlyActive) {
          hasActiveSession = true;
        }

        let sessionMins = 0;
        if (s.logoutAt) {
          const diffMs = Math.max(0, new Date(s.logoutAt).getTime() - new Date(s.loginAt || now).getTime());
          sessionMins = (typeof s.durationMinutes === 'number' && s.durationMinutes > 0) ? s.durationMinutes : Math.floor(diffMs / 60000);
        } else if (s.loginAt) {
          const diffMs = Math.max(0, now.getTime() - new Date(s.loginAt).getTime());
          sessionMins = Math.floor(diffMs / 60000);
        }

        totalDurationMinutes += sessionMins;

        const loginFormatted = s.loginTimeFormatted || (s.loginAt ? getIstDetails(new Date(s.loginAt)).formattedTime : '—');
        let logoutFormatted = isCurrentlyActive ? 'Currently Active' : (s.logoutTimeFormatted || (s.logoutAt ? getIstDetails(new Date(s.logoutAt)).formattedTime : '—'));
        if (s.autoCheckout && !logoutFormatted.includes('Auto Checkout')) {
          logoutFormatted += ' (Auto Checkout)';
        }
        
        let durFormatted = s.durationFormatted || formatDuration(s.loginAt, s.logoutAt || now);
        if (isCurrentlyActive && !durFormatted.includes('Active')) durFormatted += ' (Active)';
        if (s.autoCheckout && !durFormatted.includes('Auto Checkout')) durFormatted += ' (Auto Checkout)';

        return {
          id: String(s._id || s.id),
          loginAt: s.loginAt,
          logoutAt: s.logoutAt,
          loginTimeFormatted: loginFormatted,
          logoutTimeFormatted: logoutFormatted,
          durationMinutes: sessionMins,
          durationFormatted: durFormatted,
          isCurrentlyActive,
          autoCheckout: Boolean(s.autoCheckout),
          summary: `${loginFormatted} – ${logoutFormatted}`
        };
      });

      // STATUS PRIORITY:
      // 1. Active session -> 'available'
      // 2. Has completed attendance sessions -> 'offline'
      // 3. No attendance sessions for selected date -> 'not_checked_in'
      const computedStatus = hasActiveSession
        ? 'available'
        : (formattedSessions.length > 0 ? 'offline' : 'not_checked_in');

      // Filter check for status query parameter if specified
      if (status && status !== 'All') {
        const reqStat = String(status).toLowerCase();
        if (reqStat.includes('avail') && computedStatus !== 'available') return null;
        if (reqStat.includes('off') && computedStatus !== 'offline') return null;
        if (reqStat.includes('not') && computedStatus !== 'not_checked_in') return null;
      }

      // Format total accumulated daily duration
      const hoursTotal = Math.floor(totalDurationMinutes / 60);
      const minsTotal = totalDurationMinutes % 60;
      let totalDurationStr = '0m';
      if (hoursTotal > 0 && minsTotal > 0) {
        totalDurationStr = `${hoursTotal}h ${minsTotal}m`;
      } else if (hoursTotal > 0) {
        totalDurationStr = `${hoursTotal}h`;
      } else if (minsTotal > 0) {
        totalDurationStr = `${minsTotal}m`;
      }

      if (hasActiveSession && totalDurationMinutes > 0) {
        totalDurationStr += ' (Active)';
      } else if (hasActiveSession) {
        totalDurationStr = 'Active';
      }

      const loginSummary = formattedSessions.length > 0
        ? formattedSessions.map(sf => sf.loginTimeFormatted).join(' | ')
        : '—';
      const logoutSummary = formattedSessions.length > 0
        ? formattedSessions.map(sf => sf.logoutTimeFormatted).join(' | ')
        : '—';

      return {
        id: `${group.staffId}_${group.date}`,
        staffId: group.staffId,
        staffName: group.staffName,
        empId: group.empId,
        role: group.role,
        date: group.date,
        displayDate: formattedDisplayDate,
        sessions: formattedSessions,
        totalDurationMinutes,
        durationFormatted: totalDurationStr,
        status: computedStatus,
        loginTimeFormatted: loginSummary,
        logoutTimeFormatted: logoutSummary
      };
    }).filter(Boolean);

    console.log(`[Attendance History] staffId: ${staffId || 'All'}, month: ${month || 'None'}, date: ${date || 'None'}, rawSessions count: ${rawSessions.length}, grouped records count: ${aggregatedRecords.length}`);

    if (targetUserObj && targetUserObj.name && targetUserObj.name.toLowerCase().includes('venky')) {
      const venkyOct5 = rawSessions.filter(s => normalizeToIstDateStr(s.date, s.loginAt) === '2026-10-05');
      console.log(`[Attendance Debug] Venky / ${targetUserObj.empId || 'RMSW-01'} 2026-10-05 matching sessions: ${venkyOct5.length}`);
      venkyOct5.forEach(s => {
        console.log(`  -> Session ID: ${s._id}, loginAt: ${s.loginAt}, logoutAt: ${s.logoutAt}, date: ${s.date}, staffId: ${s.staffId}`);
      });
    }

    return res.status(200).json({
      success: true,
      count: aggregatedRecords.length,
      history: aggregatedRecords,
      records: aggregatedRecords
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

// @desc    Trigger Midnight IST Auto Checkout Manually (Manager/Admin/Test)
// @route   POST /api/staff-attendance/trigger-auto-checkout
// @access  Public / Private
exports.triggerAutoCheckout = async (req, res) => {
  try {
    const { performAutoCheckout } = require('../services/autoCheckoutService');
    const result = await performAutoCheckout();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Auto checkout execution failed', error: error.message });
  }
};

