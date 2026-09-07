const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const User = require('./backend/models/User');

async function checkUsers() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/flavora_resto';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const managers = await User.find({ role: 'Manager' }).select('_id name email role branch phone empId');
    console.log('Managers in User collection:', JSON.stringify(managers, null, 2));

    const allUsers = await User.find({}).select('_id name email role branch empId');
    console.log(`Total users in User collection: ${allUsers.length}`);
    console.log('All user accounts:', JSON.stringify(allUsers, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error inspecting users:', err);
  }
}

checkUsers();
