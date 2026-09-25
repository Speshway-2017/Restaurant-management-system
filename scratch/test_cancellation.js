const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const dns = require('dns');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/flavora_rms';

const Order = require('../backend/models/Order');

async function runTest() {
  try {
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully!');

    // 1. Create a test multi-item order
    const testOrderId = `TEST-ORD-${Date.now().toString().slice(-4)}`;
    const testOrder = await Order.create({
      orderId: testOrderId,
      table: 'T-99',
      type: 'Dine-In',
      customer: 'Test Customer',
      items: [
        { id: 'item-0', name: 'Butter Chicken', price: 350, quantity: 1, status: 'PLACED' },
        { id: 'item-1', name: 'Garlic Naan', price: 60, quantity: 2, status: 'PLACED' }
      ],
      total: 470,
      subtotal: 470,
      finalAmount: 470,
      status: 'Placed',
      waiterStatus: 'ACCEPTED'
    });

    console.log(`✓ Test Order created: #${testOrder.orderId} (ID: ${testOrder._id})`);
    console.log(`Initial items:`, testOrder.items.map(i => `${i.name} (${i.status}) - ₹${i.price * i.quantity}`));
    console.log(`Initial Total: ₹${testOrder.total}`);

    // Mock Express Request & Response for controller test
    const { requestOrderCancellation } = require('../backend/controllers/orderController');

    let responseData = null;
    let responseStatus = 200;

    const mockReq = {
      params: { id: testOrder.orderId },
      body: {
        reason: 'Customer changed mind',
        itemsToCancel: ['item-0'] // Cancelling Butter Chicken
      },
      user: { role: 'Waiter', name: 'Test Waiter' }
    };

    const mockRes = {
      status: (code) => {
        responseStatus = code;
        return mockRes;
      },
      json: (data) => {
        responseData = data;
        return mockRes;
      }
    };

    console.log('\n--- Executing Item Cancellation Request for item-0 (Butter Chicken) ---');
    await requestOrderCancellation(mockReq, mockRes);

    console.log(`API Response Status: ${responseStatus}`);
    console.log(`API Success: ${responseData?.success}`);
    console.log(`API Message: ${responseData?.message}`);

    // Verify persisted document in MongoDB
    const freshOrder = await Order.findById(testOrder._id);

    console.log('\n--- Persisted Mongo Document Verification ---');
    console.log(`Order Status: ${freshOrder.status}`);
    console.log(`Updated Total: ₹${freshOrder.total}`);
    console.log(`Updated Subtotal: ₹${freshOrder.subtotal}`);
    console.log(`Updated Final Amount: ₹${freshOrder.finalAmount}`);
    console.log(`Items Statuses:`);
    freshOrder.items.forEach((it, idx) => {
      console.log(`  [Item ${idx}] ${it.name}: status=${it.status}, isCancelled=${it.isCancelled}, price=₹${it.price * it.quantity}`);
    });

    // Test Assertions
    const cancelledItem = freshOrder.items.find(i => i.name === 'Butter Chicken');
    const activeItem = freshOrder.items.find(i => i.name === 'Garlic Naan');

    if (!cancelledItem || cancelledItem.status !== 'CANCELLED' || !cancelledItem.isCancelled) {
      throw new Error('TEST FAILED: Butter Chicken was NOT set to CANCELLED status!');
    }
    if (!activeItem || activeItem.status === 'CANCELLED') {
      throw new Error('TEST FAILED: Garlic Naan was incorrectly cancelled!');
    }
    if (freshOrder.total !== 120 || freshOrder.subtotal !== 120) {
      throw new Error(`TEST FAILED: Recalculated total expected 120, got ${freshOrder.total}`);
    }

    console.log('\n✅ TEST SUCCESSFUL: Item cancellation functionality, totals calculation, and Mongo persistence verified!');

    // Clean up test document
    await Order.deleteOne({ _id: testOrder._id });
    console.log('Test document cleaned up.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ TEST ERROR:', err.message);
    process.exit(1);
  }
}

runTest();
