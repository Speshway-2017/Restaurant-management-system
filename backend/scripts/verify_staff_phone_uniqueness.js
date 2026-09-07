const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');

const BASE_URL = 'http://localhost:5000';

async function run() {
  console.log('🔄 Connecting to MongoDB...');
  await connectDB();
  console.log('✅ Connected to MongoDB.');

  // Login as manager1
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'manager1@rms.com', password: 'manager123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;
  if (!token) throw new Error('Login failed for manager1');
  console.log('✅ Logged in as Manager 1.');

  // Existing user: Waiter Venky has phone 9876543211
  const venky = await User.findOne({ email: 'waiter1@rms.com' });
  console.log(`Existing user for duplicate test: ${venky.name} (${venky.phone})`);

  // TEST 1: Check phone endpoint with existing mobile number
  console.log('\n--- TEST 1: CHECK-PHONE API WITH EXISTING MOBILE NUMBER ---');
  const checkRes1 = await fetch(`${BASE_URL}/api/staff/check-phone?phone=${venky.phone}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const checkData1 = await checkRes1.json();
  console.log('Check result:', checkData1);
  if (!checkData1.exists) throw new Error('Test 1 Failed: Expected exists: true');
  console.log('✅ Test 1 PASSED: Duplicate mobile detected by check-phone endpoint.');

  // TEST 2: Check phone endpoint with fresh unique mobile number
  console.log('\n--- TEST 2: CHECK-PHONE API WITH UNIQUE MOBILE NUMBER ---');
  const uniquePhone = '99999' + Math.floor(10000 + Math.random() * 90000);
  const checkRes2 = await fetch(`${BASE_URL}/api/staff/check-phone?phone=${uniquePhone}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const checkData2 = await checkRes2.json();
  console.log('Check result:', checkData2);
  if (checkData2.exists) throw new Error('Test 2 Failed: Expected exists: false');
  console.log('✅ Test 2 PASSED: Unique mobile correctly reported as available.');

  // TEST 3: Attempt to create staff with existing mobile number -> must return 400
  console.log('\n--- TEST 3: CREATE STAFF WITH DUPLICATE MOBILE NUMBER ---');
  const createRes1 = await fetch(`${BASE_URL}/api/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Duplicate Phone Tester',
      email: `test_dup_${Date.now()}@flavora.in`,
      role: 'Waiter',
      phone: venky.phone,
      password: 'password123'
    })
  });
  const createData1 = await createRes1.json();
  console.log('Status code:', createRes1.status);
  console.log('Message:', createData1.message);
  if (createRes1.status !== 400 || !createData1.message.includes('already exists')) {
    throw new Error(`Test 3 Failed: Expected 400 with duplicate message, got ${createRes1.status}`);
  }
  console.log('✅ Test 3 PASSED: Creation rejected with 400 Bad Request and duplicate warning message.');

  // TEST 4: Create staff with unique mobile number -> must succeed
  console.log('\n--- TEST 4: CREATE STAFF WITH UNIQUE MOBILE NUMBER ---');
  const uniqueEmail = `test_unique_${Date.now()}@flavora.in`;
  const createRes2 = await fetch(`${BASE_URL}/api/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Unique Phone Staff',
      email: uniqueEmail,
      role: 'Waiter',
      phone: uniquePhone,
      password: 'password123'
    })
  });
  const createData2 = await createRes2.json();
  console.log('Status code:', createRes2.status);
  console.log('Created ID:', createData2._id || createData2.id);
  if (createRes2.status !== 201) {
    throw new Error(`Test 4 Failed: Expected 201, got ${createRes2.status}`);
  }
  console.log('✅ Test 4 PASSED: Staff member successfully created with unique mobile number.');

  // TEST 5: Update staff to duplicate mobile number -> must return 400
  console.log('\n--- TEST 5: UPDATE STAFF TO DUPLICATE MOBILE NUMBER ---');
  const updateRes = await fetch(`${BASE_URL}/api/staff/${createData2._id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      phone: venky.phone
    })
  });
  const updateData = await updateRes.json();
  console.log('Status code:', updateRes.status);
  console.log('Message:', updateData.message);
  if (updateRes.status !== 400) {
    throw new Error('Test 5 Failed: Expected 400 on duplicate phone update');
  }
  console.log('✅ Test 5 PASSED: Update rejected with 400 when attempting to use an existing mobile number.');

  // CLEANUP: remove the test user
  await User.findByIdAndDelete(createData2._id);
  console.log('\n🧹 Test staff member cleaned up.');

  console.log('\n==================================================');
  console.log('🎉 ALL MOBILE NUMBER UNIQUENESS TESTS PASSED!');
  console.log('==================================================');
  process.exit(0);
}

run().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
