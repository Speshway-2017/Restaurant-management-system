const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './backend/.env' });
const User = require('./backend/models/User');
const authService = require('./backend/services/authService');

async function runTests() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/flavora_resto';
    await mongoose.connect(mongoUri);
    console.log('--- TEST START: Strict Manager Account Data Isolation ---');

    // 1. Check initial user records
    const initialUsers = await User.find({ role: 'Manager' });
    console.log(`Found ${initialUsers.length} Managers in DB.`);

    // 2. Test Login Manager 1 (Ram)
    console.log('\n[TEST 1] Logging in Manager 1 (manager1@rms.com)...');
    const ramRes = await authService.login('manager1@rms.com', 'manager123');
    console.log('Ram Login OK:', {
      id: ramRes.user.id,
      name: ramRes.user.name,
      email: ramRes.user.email,
      role: ramRes.user.role,
      empId: ramRes.user.empId
    });

    if (ramRes.user.email !== 'manager1@rms.com' || ramRes.user.name !== 'Manager Ram') {
      throw new Error(`Ram login failed identity assertion: ${JSON.stringify(ramRes.user)}`);
    }

    // 3. Test Login Manager 2 (Kiran)
    console.log('\n[TEST 2] Logging in Manager 2 (manager2@rms.com)...');
    const kiranRes = await authService.login('manager2@rms.com', 'manager123');
    console.log('Kiran Login OK:', {
      id: kiranRes.user.id,
      name: kiranRes.user.name,
      email: kiranRes.user.email,
      role: kiranRes.user.role,
      empId: kiranRes.user.empId
    });

    if (kiranRes.user.email !== 'manager2@rms.com' || kiranRes.user.name !== 'Manager Kiran') {
      throw new Error(`Kiran login failed identity assertion: ${JSON.stringify(kiranRes.user)}`);
    }

    // 4. Assert distinct user IDs
    console.log('\n[TEST 3] Asserting distinct User IDs...');
    if (String(ramRes.user.id) === String(kiranRes.user.id)) {
      throw new Error('FATAL: Ram and Kiran share the exact same User ID!');
    }
    console.log(`SUCCESS: Ram ID (${ramRes.user.id}) != Kiran ID (${kiranRes.user.id})`);

    // 5. Test Invalid Password
    console.log('\n[TEST 4] Testing invalid password rejection...');
    try {
      await authService.login('manager1@rms.com', 'wrongpassword');
      throw new Error('FAILED: Wrong password did not throw error!');
    } catch (err) {
      console.log('SUCCESS: Wrong password properly rejected:', err.message);
    }

    // 6. Test Profile Update Isolation
    console.log('\n[TEST 5] Testing Profile Isolation...');
    const originalRamPhone = ramRes.user.phone;
    const testKiranPhone = '+91 99999 88888';
    await authService.updateUser(kiranRes.user.id, { phone: testKiranPhone, department: 'Kiran Ops' });

    const updatedRam = await User.findById(ramRes.user.id);
    const updatedKiran = await User.findById(kiranRes.user.id);

    console.log('After Kiran update:');
    console.log(`Ram Phone: ${updatedRam.phone} (Should be: ${originalRamPhone})`);
    console.log(`Kiran Phone: ${updatedKiran.phone} (Should be: ${testKiranPhone})`);

    if (updatedRam.phone === testKiranPhone) {
      throw new Error('FATAL: Ram phone was overwritten by Kiran update!');
    }

    // Reset Kiran phone back
    await authService.updateUser(kiranRes.user.id, { phone: kiranRes.user.phone, department: 'Operations & Floor Management' });

    // 7. Verify no users were deleted
    const finalUsers = await User.find({ role: 'Manager' });
    console.log(`\n[FINAL CHECK] Managers count: ${finalUsers.length} (Initial: ${initialUsers.length})`);
    if (finalUsers.length < initialUsers.length) {
      throw new Error('FATAL: A user record was deleted!');
    }

    console.log('\n--- ALL VERIFICATIONS PASSED SUCCESSFULLY ---');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runTests();
