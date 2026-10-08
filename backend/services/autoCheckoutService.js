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

/**
 * Calculates the exact 12:00 AM (00:00:00.000 IST) Date object for the calendar day after dateStr (YYYY-MM-DD)
 */
const getMidnightIstDateOfNextDay = (dateStr) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const now = new Date();
    const istDate = getIstDetails(now).dateStr;
    const [y, m, d] = istDate.split('-').map(Number);
    const nextDayUtcMs = Date.UTC(y, m - 1, d, 0, 0, 0);
    return new Date(nextDayUtcMs - (5.5 * 60 * 60 * 1000));
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  // Date.UTC(y, m-1, d+1, 0, 0, 0) is 00:00:00 UTC of next day.
  // IST is UTC+5:30. Subtracting 5.5 hours (19800000 ms) yields 00:00:00.000 IST of next day.
  const nextDayUtcMs = Date.UTC(y, m - 1, d + 1, 0, 0, 0);
  return new Date(nextDayUtcMs - (5.5 * 60 * 60 * 1000));
};

/**
 * Perform Midnight Automatic Attendance Checkout for Operational Roles ONLY (Waiter, Chef, Receptionist)
 * Triggered when IST Calendar Date changes (at 00:00 IST).
 * Idempotent: Safe to execute multiple times.
 */
const performAutoCheckout = async () => {
  try {
    const now = new Date();
    const currentIst = getIstDetails(now);

    console.log(`[AutoCheckout] Executing midnight IST attendance auto-checkout check at ${now.toISOString()} (IST: ${currentIst.dateStr} ${currentIst.formattedTime})`);

    // Operational roles ONLY: waiter, chef, receptionist. Exclude manager and admin.
    const operationalRoles = ['waiter', 'chef', 'receptionist'];

    // 1. Find all StaffAttendance records where status="available", role in waiter/chef/receptionist, date < currentIstDateStr, logoutAt=null
    const activeSessions = await StaffAttendance.find({
      status: 'available',
      logoutAt: null,
      role: { $in: operationalRoles },
      date: { $lt: currentIst.dateStr }
    });

    console.log(`[AutoCheckout] Found ${activeSessions.length} active operational session(s) pending auto-checkout from prior IST dates.`);

    const io = getIO();
    const checkedOutSessions = [];

    for (const session of activeSessions) {
      // Re-verify that session is still active and hasn't been checked out manually
      if (session.logoutAt !== null || session.status === 'offline') {
        continue;
      }

      // Calculate exact 12:00 AM IST of the day following session.date
      const midnightLogoutAt = getMidnightIstDateOfNextDay(session.date);
      const loginAtDate = session.loginAt ? new Date(session.loginAt) : midnightLogoutAt;

      const diffMs = Math.max(0, midnightLogoutAt.getTime() - loginAtDate.getTime());
      const durationMinutes = Math.floor(diffMs / 60000);
      const durationFormatted = formatDuration(loginAtDate, midnightLogoutAt);

      // Update StaffAttendance session record (preserve original date, logoutAt = 12:00 AM IST of next day)
      session.logoutAt = midnightLogoutAt;
      session.logoutTimeFormatted = '12:00 AM';
      session.status = 'offline';
      session.autoCheckout = true;
      session.durationMinutes = durationMinutes;
      session.durationFormatted = durationFormatted;

      await session.save();

      console.log(`[AutoCheckout] Automatically checked out staff: ${session.staffName} (${session.role}, ID: ${session.staffId}), Date: ${session.date}, Duration: ${durationFormatted}, LogoutAt: ${midnightLogoutAt.toISOString()}`);

      // Update corresponding User document attendance/availability fields
      try {
        const userObj = await User.findById(session.staffId);
        if (userObj) {
          userObj.attendanceStatus = 'Offline';
          userObj.hoursLogged = session.durationFormatted;

          if (!Array.isArray(userObj.notifications)) {
            userObj.notifications = [];
          }
          userObj.notifications.push({
            id: `auto_checkout_${session._id}_${now.getTime()}`,
            title: "Attendance Auto Checkout",
            message: "Your attendance was automatically checked out at 12:00 AM because the workday has ended.",
            time: '12:00 AM',
            read: false,
            createdAt: now
          });

          await userObj.save();
        }
      } catch (userErr) {
        console.error(`[AutoCheckout] Error updating User document for ${session.staffName}:`, userErr.message);
      }

      // Emit Socket.IO event: attendanceAutoCheckout to individual staff room
      if (io) {
        const staffPayload = {
          staffId: String(session.staffId),
          staffName: session.staffName,
          role: session.role,
          logoutAt: midnightLogoutAt,
          date: session.date,
          autoCheckout: true,
          message: "Your attendance was automatically checked out at 12:00 AM because the workday has ended."
        };

        io.to(`staff:${session.staffId}`).emit('attendanceAutoCheckout', staffPayload);
        io.to(`user_${session.staffId}`).emit('attendanceAutoCheckout', staffPayload);

        // Emit staff attendance update event to managers so Manager Staff Management updates in real time
        const managerUpdatePayload = {
          type: 'AUTO_CHECKOUT',
          staffId: String(session.staffId),
          staffName: session.staffName,
          empId: session.empId,
          role: session.role,
          normRole: normalizeRole(session.role),
          status: 'offline',
          action: 'checkOut',
          autoCheckout: true,
          timestamp: midnightLogoutAt.toISOString(),
          loginAt: session.loginAt,
          logoutAt: midnightLogoutAt,
          loginTimeFormatted: session.loginTimeFormatted,
          logoutTimeFormatted: '12:00 AM',
          durationMinutes: durationMinutes,
          durationFormatted: durationFormatted,
          date: session.date,
          attendanceId: String(session._id)
        };

        io.emit('staffAvailabilityUpdated', managerUpdatePayload);
        io.emit('staff_attendance_updated', managerUpdatePayload);
        io.emit('staffAttendanceUpdated', managerUpdatePayload);
      }

      checkedOutSessions.push(session);
    }

    // Retroactive cleanup for existing autoCheckout records saved with execution timestamp instead of midnight IST
    try {
      const oldAutoSessions = await StaffAttendance.find({
        autoCheckout: true,
        role: { $in: operationalRoles }
      });

      for (const oldSession of oldAutoSessions) {
        if (!oldSession.date || !oldSession.loginAt) continue;
        const expectedMidnight = getMidnightIstDateOfNextDay(oldSession.date);
        const currentLogoutTime = oldSession.logoutAt ? new Date(oldSession.logoutAt).getTime() : 0;

        if (Math.abs(currentLogoutTime - expectedMidnight.getTime()) > 120000) {
          const loginAtD = new Date(oldSession.loginAt);
          const diffMs = Math.max(0, expectedMidnight.getTime() - loginAtD.getTime());
          const durMins = Math.floor(diffMs / 60000);
          const durFormatted = formatDuration(loginAtD, expectedMidnight);

          oldSession.logoutAt = expectedMidnight;
          oldSession.logoutTimeFormatted = '12:00 AM';
          oldSession.durationMinutes = durMins;
          oldSession.durationFormatted = durFormatted;
          await oldSession.save();
          console.log(`[AutoCheckout Cleanup] Corrected past autoCheckout record ID=${oldSession._id} for ${oldSession.staffName}: logoutAt -> ${expectedMidnight.toISOString()}, Duration -> ${durFormatted}`);
        }
      }
    } catch (cleanErr) {
      console.warn('[AutoCheckout Cleanup] Warning during retroactive cleanup:', cleanErr.message);
    }

    return {
      success: true,
      count: checkedOutSessions.length,
      checkedOutSessions
    };
  } catch (error) {
    console.error('[AutoCheckout] Fatal error during auto-checkout execution:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Initializes scheduled job to execute at 12:00 AM Asia/Kolkata
 */
const initAutoCheckoutJob = () => {
  console.log('[AutoCheckout Job] Initializing 12:00 AM Asia/Kolkata scheduled job...');

  // 1. Startup check: catch any unclosed active operational sessions from previous IST dates
  setTimeout(() => {
    performAutoCheckout().catch(err => {
      console.error('[AutoCheckout Job] Error in startup check:', err);
    });
  }, 3000);

  // 2. Interval check every 30 seconds to check if current IST time is 00:00 (12:00 AM)
  let lastExecutedIstDate = '';

  setInterval(async () => {
    try {
      const now = new Date();
      const optionsDate = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
      const optionsTime = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false };

      const istDate = new Intl.DateTimeFormat('en-CA', optionsDate).format(now);
      const istTime = new Intl.DateTimeFormat('en-US', optionsTime).format(now);

      // Trigger at 00:00 IST once per calendar day
      if (istTime.startsWith('00:00') && lastExecutedIstDate !== istDate) {
        lastExecutedIstDate = istDate;
        console.log(`[AutoCheckout Job] Midnight IST reached! Running auto checkout for date ${istDate}...`);
        await performAutoCheckout();
      }
    } catch (e) {
      console.error('[AutoCheckout Job] Timer interval error:', e);
    }
  }, 30000);
};

const getPreviousIstDateStr = (currentIstDateStr) => {
  const d = new Date(currentIstDateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
};

module.exports = {
  performAutoCheckout,
  initAutoCheckoutJob,
  getPreviousIstDateStr
};
