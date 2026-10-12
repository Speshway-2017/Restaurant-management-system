const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch(e){}
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const getPrefixForRole = (role) => {
  const r = String(role || '').toLowerCase();
  if (r.includes('chef')) return 'RMSC';
  if (r.includes('receptionist') || r.includes('cashier')) return 'RMSR';
  if (r.includes('waiter')) return 'RMSW';
  if (r.includes('manager')) return 'RMSM';
  if (r.includes('admin')) return 'RMSAD';
  return 'RMS';
};

async function auditAndFixEmpIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = require('../models/User');
    const StaffAttendance = require('../models/StaffAttendance');

    const users = await User.find({}).sort({ createdAt: 1 });
    console.log(`Auditing ${users.length} users in database...`);

    // Group users by empId (case-insensitive)
    const empIdMap = {};
    for (const u of users) {
      const eId = (u.empId || '').trim().toUpperCase();
      if (!empIdMap[eId]) empIdMap[eId] = [];
      empIdMap[eId].push(u);
    }

    // Role-based highest counter tracker
    const roleMaxMap = {};
    for (const u of users) {
      const prefix = getPrefixForRole(u.role);
      const eId = (u.empId || '').trim().toUpperCase();
      const match = eId.match(new RegExp(`^${prefix}-(\\d+)`, 'i'));
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num)) {
          roleMaxMap[prefix] = Math.max(roleMaxMap[prefix] || 0, num);
        }
      }
    }

    console.log('Current max sequence per prefix:', roleMaxMap);

    // Resolve duplicate empIds
    for (const [eId, userList] of Object.entries(empIdMap)) {
      if (!eId || userList.length <= 1) continue;

      console.log(`⚠️ Found duplicate Employee ID: ${eId} assigned to ${userList.length} users:`);
      userList.forEach(u => console.log(`   - ${u.name} (${u.email}, role: ${u.role}, ID: ${u._id})`));

      // Determine who keeps the ID: the one with the most attendance records or oldest record
      let primaryUser = userList[0];
      let maxAttCount = -1;

      for (const u of userList) {
        const attCount = await StaffAttendance.countDocuments({ staffId: u._id });
        if (attCount > maxAttCount) {
          maxAttCount = attCount;
          primaryUser = u;
        }
      }

      console.log(`   -> Primary keeper of ${eId}: ${primaryUser.name} (${primaryUser.email}) with ${maxAttCount} attendance records.`);

      // Reassign duplicates
      for (const u of userList) {
        if (String(u._id) === String(primaryUser._id)) continue;

        const prefix = getPrefixForRole(u.role);
        roleMaxMap[prefix] = (roleMaxMap[prefix] || 0) + 1;
        const newEmpId = `${prefix}-${String(roleMaxMap[prefix]).padStart(2, '0')}`;

        console.log(`   -> Reassigning ${u.name} (${u.email}) from ${eId} to ${newEmpId}`);
        u.empId = newEmpId;
        await u.save();

        // Update any attendance records for this user to newEmpId
        const updatedAtt = await StaffAttendance.updateMany(
          { staffId: u._id },
          { $set: { empId: newEmpId } }
        );
        if (updatedAtt.modifiedCount > 0) {
          console.log(`   -> Updated ${updatedAtt.modifiedCount} attendance records for ${u.name} to ${newEmpId}`);
        }
      }
    }

    // Ensure all users have valid non-empty empIds
    for (const u of users) {
      if (!u.empId || u.empId.trim() === '') {
        const prefix = getPrefixForRole(u.role);
        roleMaxMap[prefix] = (roleMaxMap[prefix] || 0) + 1;
        const newEmpId = `${prefix}-${String(roleMaxMap[prefix]).padStart(2, '0')}`;
        console.log(`Assigning missing empId for ${u.name} (${u.email}): ${newEmpId}`);
        u.empId = newEmpId;
        await u.save();
      }
    }

    // Normalize attendanceStatus: If a staff user has no active open session today, set attendanceStatus to 'Offline'
    const todayIso = new Date().toISOString().split('T')[0];
    for (const u of users) {
      const activeSession = await StaffAttendance.findOne({
        staffId: u._id,
        status: 'available',
        logoutAt: null
      });
      if (!activeSession && u.attendanceStatus === 'Present') {
        console.log(`Setting attendanceStatus to 'Offline' for ${u.name} (no active session)`);
        u.attendanceStatus = 'Offline';
        await u.save();
      }
    }

    // Create unique index on empId
    try {
      await User.collection.createIndex({ empId: 1 }, { unique: true, sparse: true });
      console.log('✅ Unique sparse index created on User.empId in MongoDB.');
    } catch (idxErr) {
      console.warn('Index notice:', idxErr.message);
    }

    console.log('\n=== AUDIT COMPLETE. FINAL USERS ===');
    const finalUsers = await User.find({}).select('_id name email role empId status attendanceStatus').lean();
    console.table(finalUsers);

    process.exit(0);
  } catch (err) {
    console.error('Audit failed:', err);
    process.exit(1);
  }
}

auditAndFixEmpIds();
