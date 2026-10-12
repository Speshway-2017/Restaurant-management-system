const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch(e){}
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flavora')
  .then(async () => {
    const StaffAttendance = require('../models/StaffAttendance');
    const User = require('../models/User');

    console.log('=== USERS IN DB ===');
    const users = await User.find({}).select('_id name email role empId status attendanceStatus').lean();
    console.table(users);
    process.exit(0);
  })
  .catch(err => {
    console.error('DB Connect error:', err);
    process.exit(1);
  });
