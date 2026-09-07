const mongoose = require('mongoose');
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
require('dotenv').config({ path: './backend/.env' });
const Order = require('./backend/models/Order');
const User = require('./backend/models/User');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const orders = await Order.find({}).lean();
  console.log(`Total orders in DB: ${orders.length}`);
  if (orders.length > 0) {
    console.log('Sample order keys:', Object.keys(orders[0]));
    console.log('Sample order 0:', {
      orderId: orders[0].orderId,
      table: orders[0].table,
      total: orders[0].total,
      managerId: orders[0].managerId,
      branch: orders[0].branch,
      createdBy: orders[0].createdBy
    });
  }
  const managers = await User.find({ role: 'Manager' }).lean();
  console.log('Managers:', managers.map(m => ({ id: m._id, name: m.name, email: m.email, branch: m.branch })));
  await mongoose.disconnect();
}
check();
