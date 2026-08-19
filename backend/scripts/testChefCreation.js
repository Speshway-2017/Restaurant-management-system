const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const testChef = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flavora_resto');
    console.log('Testing Chef creation against MongoDB User model...');

    const testEmail = `test_chef_${Date.now()}@rms.com`;
    const chefDoc = await User.create({
      name: 'Chef Test User',
      email: testEmail,
      password: 'chefpassword123',
      role: 'Chef',
      phone: '9876543210',
      branch: 'Jubilee Hills (Main Branch)',
      empId: `RMSC-${Math.floor(10 + Math.random() * 90)}`
    });

    console.log('✅ TEST CHEF CREATED SUCCESSFULLY IN MONGODB:');
    console.log({
      _id: chefDoc._id,
      name: chefDoc.name,
      email: chefDoc.email,
      role: chefDoc.role,
      empId: chefDoc.empId
    });

    // Cleanup test user
    await User.findByIdAndDelete(chefDoc._id);
    console.log('Cleaned up test document.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Chef creation failed:', err.message);
    process.exit(1);
  }
};

testChef();
