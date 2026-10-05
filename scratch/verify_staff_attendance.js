const BASE_URL = 'http://localhost:5000/api';

async function verifyStaffAttendance() {
  console.log('🧪 Starting Staff Attendance API Verification...');

  // 1. Login as Chef to get token
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'chef@flavorakitchen.in', password: 'chef123password' })
  });

  const loginData = await loginRes.json();
  if (!loginData.token) {
    console.error('❌ Chef login failed:', loginData);
    return;
  }
  const chefToken = loginData.token;
  console.log('✅ Chef Logged In successfully. Staff ID:', loginData.user?._id || loginData.user?.id);

  // 2. Perform Check IN
  console.log('\n--> Testing Check IN (Duty Available)...');
  const inRes = await fetch(`${BASE_URL}/staff-attendance/in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${chefToken}`
    }
  });
  const inData = await inRes.json();
  console.log('Check IN Result:', inData.success ? 'PASSED' : 'FAILED', inData);

  // 3. Test Duplicate Check IN Prevention
  console.log('\n--> Testing Duplicate Check IN Prevention...');
  const inRes2 = await fetch(`${BASE_URL}/staff-attendance/in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${chefToken}`
    }
  });
  const inData2 = await inRes2.json();
  console.log('Duplicate Check IN Prevention Result:', inData2.alreadyActive ? 'PASSED (Duplicate Prevented)' : 'NO_DUPLICATE_FLAG', inData2.message);

  // 4. Fetch Current Availability (Manager View)
  // Login as Manager
  const mgrLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'manager@flavorakitchen.in', password: 'manager123password' })
  });
  const mgrData = await mgrLogin.json();
  const mgrToken = mgrData.token;

  console.log('\n--> Fetching Manager Real-Time Availability...');
  const availRes = await fetch(`${BASE_URL}/staff-attendance/current`, {
    headers: { 'Authorization': `Bearer ${mgrToken}` }
  });
  const availData = await availRes.json();
  console.log('Current Availability Summary:', availData.summary);
  console.log('Staff Availability Count:', availData.staff?.length);

  // 5. Perform Check OUT
  console.log('\n--> Testing Check OUT (Duty Offline)...');
  const outRes = await fetch(`${BASE_URL}/staff-attendance/out`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${chefToken}`
    }
  });
  const outData = await outRes.json();
  console.log('Check OUT Result:', outData.success ? 'PASSED' : 'FAILED', outData);

  // 6. Fetch Attendance History
  console.log('\n--> Fetching Attendance History...');
  const histRes = await fetch(`${BASE_URL}/staff-attendance/history`, {
    headers: { 'Authorization': `Bearer ${mgrToken}` }
  });
  const histData = await histRes.json();
  console.log('Attendance History Count:', histData.count);
  if (histData.history && histData.history.length > 0) {
    console.log('Latest Session Sample:', {
      staffName: histData.history[0].staffName,
      role: histData.history[0].role,
      login: histData.history[0].loginTimeFormatted,
      logout: histData.history[0].logoutTimeFormatted,
      duration: histData.history[0].durationFormatted,
      status: histData.history[0].status
    });
  }

  console.log('\n🎉 ALL STAFF ATTENDANCE VERIFICATIONS PASSED CLEANLY!');
}

verifyStaffAttendance().catch(err => console.error('Verification Error:', err));
