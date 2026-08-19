const mongoose = require('mongoose');
const dns = require('dns');
const bcrypt = require('bcryptjs');

// Fix Windows Node.js c-ares DNS SRV lookup ECONNREFUSED error for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('DNS custom server fallback not applied:', dnsErr.message);
}

// Automatically convert all legacy plain-text user passwords to bcrypt hashes on startup
const migrateExistingPasswordsToBcrypt = async () => {
  try {
    const User = require('../models/User');
    const users = await User.find({});
    let converted = 0;

    for (const user of users) {
      if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        await User.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });
        converted++;
        console.log(`🔒 Hashed plain-text password to bcrypt for: ${user.email} (${user.role})`);
      }
    }

  } catch (err) {
    console.warn('Password migration check failed:', err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected Successfully`);
    // Run password migration
    migrateExistingPasswordsToBcrypt();
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
