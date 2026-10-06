const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flavora')
  .then(async () => {
    const StaffAttendance = require('../models/StaffAttendance');
    const User = require('../models/User');

    console.log('=== USERS IN DB ===');
    const users = await User.find({}).select('name email role empId').lean();
    console.log(users);

    console.log('=== ALL ATTENDANCE RECORDS ===');
    const att = await StaffAttendance.find({}).lean();
    console.log(JSON.stringify(att, null, 2));

    process.exit(0);
  })
  .catch(err => {
    console.error('DB Connect error:', err);
    process.exit(1);
  });
