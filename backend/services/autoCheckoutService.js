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
 * Calculates the previous IST date string (YYYY-MM-DD)
 */
const getPreviousIstDateStr = (refDate = new Date()) => {
  const prevIst = new Date(refDate.getTime() - 24 * 60 * 60 * 1000);
  return getIstDetails(prevIst).dateStr;
};

/**
 * Perform Midnight Automatic Attendance Checkout for Operational Roles ONLY (Waiter, Chef, Receptionist)
 * Idempotent: Safe to execute multiple times.
 */
const performAutoCheckout = async () => {
  try {
    const now = new Date();
    const currentIst = getIstDetails(now);
    const previousIstDateStr = getPreviousIstDateStr(now);

    console.log(`[AutoCheckout] Executing midnight IST attendance auto-checkout check at ${now.toISOString()} (IST: ${currentIst.dateStr} ${currentIst.formattedTime})`);
    console.log(`[AutoCheckout] Target previous IST date for auto-checkout: ${previousIstDateStr}`);

    // Operational roles ONLY: waiter, chef, receptionist.
    // Exclude manager and admin.
    const operationalRoles = ['waiter', 'chef', 'receptionist'];

    // Find all StaffAttendance records where status="available", role in waiter/chef/receptionist, date <= previousIstDateStr (or previous IST date), logoutAt=null
    const activeSessions = await StaffAttendance.find({
      status: 'available',
      logoutAt: null,
      role: { $in: operationalRoles },
      date: { $lte: previousIstDateStr }
    });

    console.log(`[AutoCheckout] Found ${activeSessions.length} active operational session(s) pending auto-checkout.`);

    if (activeSessions.length === 0) {
      return { success: true, count: 0, checkedOutSessions: [] };
    }

    const io = getIO();
    const checkedOutSessions = [];

    for (const session of activeSessions) {
      // Re-verify that session is still active and hasn't been checked out manually
      if (session.logoutAt !== null || session.status === 'offline') {
        continue;
      }

      const loginAtDate = session.loginAt || now;
      const diffMs = Math.max(0, now.getTime() - new Date(loginAtDate).getTime());
      const durationMinutes = Math.floor(diffMs / 60000);
      const durationFormatted = formatDuration(loginAtDate, now);

      // 1. Update StaffAttendance session record
      session.logoutAt = now;
      session.logoutTimeFormatted = currentIst.formattedTime; // e.g. "12:00 AM"
      session.status = 'offline';
      session.autoCheckout = true;
      session.durationMinutes = durationMinutes;
      session.durationFormatted = `${durationFormatted} (Auto Checkout)`;

      await session.save();

      console.log(`[AutoCheckout] Automatically checked out staff: ${session.staffName} (${session.role}, ID: ${session.staffId}), Duration: ${durationFormatted}`);

      // 2. Update corresponding User document attendance/availability fields
      try {
        const userObj = await User.findById(session.staffId);
        if (userObj) {
          userObj.attendanceStatus = 'Offline';
          userObj.hoursLogged = session.durationFormatted;

          // Push persistent notification to User.notifications
          if (!Array.isArray(userObj.notifications)) {
            userObj.notifications = [];
          }
          userObj.notifications.push({
            id: `auto_checkout_${session._id}_${now.getTime()}`,
            title: "Attendance Auto Checkout",
            message: "Your attendance was automatically checked out at 12:00 AM because the workday has ended.",
            time: currentIst.formattedTime,
            read: false,
            createdAt: now
          });

          await userObj.save();
        }
      } catch (userErr) {
        console.error(`[AutoCheckout] Error updating User document for ${session.staffName}:`, userErr.message);
      }

      // 3. Emit Socket.IO event: attendanceAutoCheckout to individual staff room staff:${staffId}
      if (io) {
        const staffPayload = {
          staffId: String(session.staffId),
          staffName: session.staffName,
          role: session.role,
          logoutAt: now,
          date: session.date,
          autoCheckout: true,
          message: "Your attendance was automatically checked out at 12:00 AM because the workday has ended."
        };

        io.to(`staff:${session.staffId}`).emit('attendanceAutoCheckout', staffPayload);
        io.to(`user_${session.staffId}`).emit('attendanceAutoCheckout', staffPayload);

        // 4. Emit staff attendance update event to managers so Manager Staff Management updates in real time
        const managerUpdatePayload = {
          staffId: String(session.staffId),
          staffName: session.staffName,
          empId: session.empId,
          role: session.role,
          status: 'offline',
          action: 'checkOut',
          autoCheckout: true,
          timestamp: now.toISOString(),
          loginAt: session.loginAt,
          logoutAt: now,
          logoutTimeFormatted: session.logoutTimeFormatted,
          durationFormatted: session.durationFormatted,
          attendanceId: String(session._id)
        };

        io.emit('staffAvailabilityUpdated', managerUpdatePayload);
        io.emit('staff_attendance_updated', managerUpdatePayload);
        io.emit('staffAttendanceUpdated', managerUpdatePayload);
      }

      checkedOutSessions.push(session);
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

module.exports = {
  performAutoCheckout,
  initAutoCheckoutJob,
  getPreviousIstDateStr
};
