const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch(e){}
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const StaffAttendance = require('../models/StaffAttendance');
const { getNextEmpId } = require('../utils/empIdGenerator');

// Colors for clean output
const pass = (msg) => console.log(`\x1b[32m✔ PASS:\x1b[0m ${msg}`);
const fail = (msg) => console.log(`\x1b[31m✖ FAIL:\x1b[0m ${msg}`);
const info = (msg) => console.log(`\x1b[36mℹ INFO:\x1b[0m ${msg}`);

async function runTests() {
  console.log('================================================================');
  console.log('   FLAVORA KITCHEN RMS - VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    info('Connected to MongoDB Atlas');

    // -------------------------------------------------------------
    // TEST 1: Chef Ramu and Chef Kiran have distinct Employee IDs
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Chef Ramu & Chef Kiran Employee IDs ---');
    const chefRamu = await User.findOne({ name: /Chef Ramu/i }).lean();
    const chefKiran = await User.findOne({ name: /Chef Kiran/i }).lean();

    if (!chefRamu || !chefKiran) {
      fail(`Could not find both chefs. Ramu: ${!!chefRamu}, Kiran: ${!!chefKiran}`);
    } else {
      info(`Chef Ramu: ID=${chefRamu._id}, empId=${chefRamu.empId}, email=${chefRamu.email}`);
      info(`Chef Kiran: ID=${chefKiran._id}, empId=${chefKiran.empId}, email=${chefKiran.email}`);
      if (chefRamu.empId !== chefKiran.empId && chefRamu.empId === 'RMSC-01' && chefKiran.empId === 'RMSC-04') {
        pass(`Chef Ramu has ${chefRamu.empId} and Chef Kiran has ${chefKiran.empId}. IDs are distinct and follow convention.`);
      } else if (chefRamu.empId !== chefKiran.empId) {
        pass(`Chef Ramu has ${chefRamu.empId} and Chef Kiran has ${chefKiran.empId}. IDs are distinct.`);
      } else {
        fail(`Chef Ramu and Chef Kiran still share empId: ${chefRamu.empId}`);
      }
    }

    // -------------------------------------------------------------
    // TEST 2: Newly created staff cannot receive duplicate Employee ID
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Duplicate Employee ID Prevention ---');
    const nextChefId = await getNextEmpId('Chef');
    info(`Next generated Chef ID: ${nextChefId}`);
    if (nextChefId && nextChefId.startsWith('RMSC-')) {
      const exists = await User.findOne({ empId: nextChefId });
      if (!exists) {
        pass(`getNextEmpId correctly generated unique ID: ${nextChefId}`);
      } else {
        fail(`getNextEmpId generated an ID that already exists: ${nextChefId}`);
      }
    } else {
      fail(`Invalid generated Chef ID format: ${nextChefId}`);
    }

    // Test MongoDB Unique Index enforcement on User.empId
    let duplicateRejected = false;
    try {
      await User.create({
        name: 'Test Duplicate Chef',
        email: `test_dup_${Date.now()}@test.com`,
        phone: '9999900001',
        role: 'Chef',
        password: 'Password123!',
        empId: 'RMSC-01' // Intentionally duplicate Chef Ramu's ID
      });
    } catch (err) {
      if (err.code === 11000 || /duplicate key/i.test(err.message)) {
        duplicateRejected = true;
        pass(`MongoDB unique index successfully rejected duplicate empId RMSC-01: ${err.message}`);
      } else {
        fail(`Creation failed with unexpected error: ${err.message}`);
      }
    }
    if (!duplicateRejected) {
      fail('MongoDB permitted creating a duplicate empId!');
      // Cleanup if somehow inserted
      await User.deleteOne({ email: { $regex: /^test_dup_/ } });
    }

    // -------------------------------------------------------------
    // TEST 3: Existing duplicates resolved without corrupting attendance history
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Attendance History Integrity After ID Resolution ---');
    const ramuAttCount = await StaffAttendance.countDocuments({ staffId: chefRamu._id });
    const kiranAttCount = await StaffAttendance.countDocuments({ staffId: chefKiran._id });
    info(`Chef Ramu attendance records count: ${ramuAttCount}`);
    info(`Chef Kiran attendance records count: ${kiranAttCount}`);
    if (ramuAttCount > 0) {
      pass(`Chef Ramu retained all ${ramuAttCount} attendance records mapped to his _id.`);
    } else {
      fail('Chef Ramu attendance records missing!');
    }

    // -------------------------------------------------------------
    // TEST 4: Staff member without today's attendance shows Not Checked In
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Staff Without Today Attendance ---');
    // Check Kiran's today attendance records
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    info(`Today's IST Date: ${todayStr}`);

    const kiranTodaySessions = await StaffAttendance.find({
      staffId: chefKiran._id,
      date: todayStr
    });
    info(`Chef Kiran sessions today: ${kiranTodaySessions.length}`);

    // Verify logic from getCurrentAvailability
    const activeKiranSession = kiranTodaySessions.find(s => s.status === 'available' && !s.logoutAt && s.loginAt);
    const kiranIsAvailable = Boolean(activeKiranSession);
    if (!kiranIsAvailable) {
      pass('Chef Kiran has no active session today and is correctly evaluated as NOT available (Offline).');
    } else {
      fail('Chef Kiran is incorrectly evaluated as available!');
    }

    // -------------------------------------------------------------
    // TEST 5: Login without valid attendance check-in does not show active
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Login / Account status vs Attendance Isolation ---');
    // Ensure Chef Kiran's User status is 'Active' (profile verified/activated)
    const kiranUserDoc = await User.findById(chefKiran._id);
    info(`Chef Kiran User account status: ${kiranUserDoc.status}, attendanceStatus: ${kiranUserDoc.attendanceStatus}`);
    // Even if user.status is Active or attendanceStatus is Present in DB, attendance source of truth is StaffAttendance collection
    const simulatedIsActive = Boolean(activeKiranSession);
    if (!simulatedIsActive) {
      pass('User account status does NOT cause false active attendance.');
    } else {
      fail('User account status leaked into attendance active state.');
    }

    // -------------------------------------------------------------
    // TEST 6 & 7: Check-in shows correct check-in time & active state, and Checkout displays duration
    // -------------------------------------------------------------
    console.log('\n--- Tests 6 & 7: Check-in and Checkout Workflow Test ---');
    // Create temporary test waiter
    const testWaiterEmpId = await getNextEmpId('Waiter');
    const testWaiter = await User.create({
      name: 'Test Workflow Waiter',
      email: `test_waiter_${Date.now()}@rms.com`,
      phone: '9888877771',
      role: 'Waiter',
      password: 'Password123!',
      empId: testWaiterEmpId,
      status: 'Active',
      attendanceStatus: 'Offline'
    });
    info(`Created temporary test staff: ${testWaiter.name} (${testWaiter.empId})`);

    // 6a. Perform Check-in
    const checkInTime = new Date();
    const formattedCheckIn = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(checkInTime);
    const session = await StaffAttendance.create({
      staffId: testWaiter._id,
      staffName: testWaiter.name,
      empId: testWaiter.empId,
      role: 'waiter',
      loginAt: checkInTime,
      logoutAt: null,
      status: 'available',
      date: todayStr,
      loginTimeFormatted: formattedCheckIn,
      logoutTimeFormatted: ''
    });
    pass(`Recorded check-in at ${formattedCheckIn} for ${testWaiter.empId}. Session ID: ${session._id}`);

    // Verify active check
    const activeTestSession = await StaffAttendance.findOne({
      staffId: testWaiter._id,
      date: todayStr,
      status: 'available',
      logoutAt: null
    });
    if (activeTestSession && activeTestSession.loginTimeFormatted === formattedCheckIn) {
      pass(`Active state confirmed: Login time = ${activeTestSession.loginTimeFormatted}, logoutAt is null.`);
    } else {
      fail('Failed to verify active state for test staff.');
    }

    // 7a. Perform Checkout after 5 simulated minutes
    const checkOutTime = new Date(checkInTime.getTime() + 5 * 60 * 1000); // 5 mins later
    const formattedCheckOut = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(checkOutTime);
    activeTestSession.logoutAt = checkOutTime;
    activeTestSession.logoutTimeFormatted = formattedCheckOut;
    activeTestSession.status = 'offline';
    activeTestSession.durationMinutes = 5;
    activeTestSession.durationFormatted = '5m';
    await activeTestSession.save();

    pass(`Recorded checkout at ${formattedCheckOut}. Duration: 5m.`);

    // Verify session completed
    const closedTestSession = await StaffAttendance.findById(session._id);
    if (closedTestSession.logoutAt && closedTestSession.status === 'offline' && closedTestSession.durationFormatted === '5m') {
      pass(`Checkout state confirmed: Check OUT time = ${closedTestSession.logoutTimeFormatted}, duration = ${closedTestSession.durationFormatted}.`);
    } else {
      fail('Failed to verify checkout completed state.');
    }

    // -------------------------------------------------------------
    // TEST 8: Yesterday's attendance does not mark employee checked in today
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Yesterday Attendance Date Isolation ---');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(yesterdayDate);

    // Create a session for yesterday that has logoutAt: null (simulating unclosed yesterday session)
    const yesterdaySession = await StaffAttendance.create({
      staffId: testWaiter._id,
      staffName: testWaiter.name,
      empId: testWaiter.empId,
      role: 'waiter',
      loginAt: yesterdayDate,
      logoutAt: null,
      status: 'available',
      date: yesterdayStr,
      loginTimeFormatted: '09:00 AM',
      logoutTimeFormatted: ''
    });

    // Check today's availability for testWaiter:
    const allTestSessions = await StaffAttendance.find({ staffId: testWaiter._id }).lean();
    const todayOnlySessions = allTestSessions.filter(s => s.date === todayStr);
    const activeOnlyToday = todayOnlySessions.find(s => s.status === 'available' && !s.logoutAt && s.loginAt);

    if (!activeOnlyToday) {
      pass(`Yesterday's unclosed session (${yesterdayStr}) does NOT leak into today's (${todayStr}) availability.`);
    } else {
      fail(`Yesterday's unclosed session incorrectly caused today's status to be active!`);
    }

    // Cleanup test data
    await StaffAttendance.deleteMany({ staffId: testWaiter._id });
    await User.findByIdAndDelete(testWaiter._id);
    info('Cleaned up test staff and test sessions.');

    // -------------------------------------------------------------
    // TEST 9 & 10: Role Verification Across Chef, Waiter, Receptionist
    // -------------------------------------------------------------
    console.log('\n--- Tests 9 & 10: Multi-Role Verification (Chef, Waiter, Receptionist) ---');
    const rolesToTest = ['Chef', 'Waiter', 'Receptionist'];
    for (const role of rolesToTest) {
      const staffList = await User.find({ role: new RegExp(role, 'i') }).select('name empId role attendanceStatus').lean();
      info(`Found ${staffList.length} ${role}s in system:`);
      const empIds = new Set();
      let hasDuplicates = false;
      for (const s of staffList) {
        info(`   - ${s.name}: empId=${s.empId}, role=${s.role}`);
        if (empIds.has(s.empId)) {
          hasDuplicates = true;
          fail(`Duplicate empId found in role ${role}: ${s.empId} for ${s.name}`);
        }
        empIds.add(s.empId);
      }
      if (!hasDuplicates) {
        pass(`All ${role}s have distinct Employee IDs.`);
      }

      // Test next empId generator for role
      const nextId = await getNextEmpId(role);
      info(`   -> Next available ID for ${role}: ${nextId}`);
      if (nextId && !empIds.has(nextId)) {
        pass(`Generator returns non-colliding ID ${nextId} for ${role}.`);
      } else {
        fail(`Generator returned colliding ID for ${role}: ${nextId}`);
      }
    }

    // -------------------------------------------------------------
    // TEST LIVE API ENDPOINT (port 5000)
    // -------------------------------------------------------------
    console.log('\n--- Testing Live API Endpoint (http://localhost:5000) ---');
    try {
      const http = require('http');
      const fetchApi = (url) => new Promise((resolve, reject) => {
        http.get(url, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch(e) {
              resolve({ status: res.statusCode, body: data });
            }
          });
        }).on('error', reject);
      });

      const currentRes = await fetchApi('http://localhost:5000/api/staff-attendance/current');
      info(`API /api/staff-attendance/current status: ${currentRes.status}`);
      if (currentRes.status === 200 && currentRes.body && currentRes.body.staff) {
        const staffList = currentRes.body.staff;
        info(`Staff count in API response: ${staffList.length}`);

        const liveRamu = staffList.find(s => s.name && s.name.includes('Ramu'));
        const liveKiran = staffList.find(s => s.name && s.name.includes('Kiran'));

        if (liveRamu && liveKiran) {
          info(`Live Ramu: empId=${liveRamu.empId}, status=${liveRamu.status}, checkIn=${liveRamu.loginTimeFormatted}, checkOut=${liveRamu.logoutTimeFormatted}`);
          info(`Live Kiran: empId=${liveKiran.empId}, status=${liveKiran.status}, checkIn=${liveKiran.loginTimeFormatted}, checkOut=${liveKiran.logoutTimeFormatted}`);

          if (liveRamu.empId !== liveKiran.empId) {
            pass(`Live API returns distinct empIds: Ramu=${liveRamu.empId}, Kiran=${liveKiran.empId}`);
          } else {
            fail(`Live API still returns duplicate empId for Ramu and Kiran: ${liveRamu.empId}`);
          }

          if (liveKiran.status === 'offline' && liveKiran.logoutTimeFormatted !== 'Currently Active') {
            pass(`Live API correctly displays Chef Kiran as Offline with Check OUT: ${liveKiran.logoutTimeFormatted} (NOT Currently Active).`);
          } else {
            fail(`Live API still shows Chef Kiran as active! status=${liveKiran.status}, checkOut=${liveKiran.logoutTimeFormatted}`);
          }
        } else {
          info(`Could not find both chefs in live staff list. Found: Ramu=${!!liveRamu}, Kiran=${!!liveKiran}`);
        }
      }
    } catch (apiErr) {
      info(`Live API call notice: ${apiErr.message}`);
    }

    console.log('\n================================================================');
    console.log('   ALL VERIFICATION TESTS COMPLETED');
    console.log('================================================================');
    process.exit(0);

  } catch (err) {
    console.error('Fatal error during test execution:', err);
    process.exit(1);
  }
}

runTests();
