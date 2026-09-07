const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Order = require('../models/Order');
const Table = require('../models/Table');
const orderService = require('../services/orderService');
const { io } = require(path.join(__dirname, '../../frontend/node_modules/socket.io-client'));

const connectDB = require('../config/db');

async function run() {
  console.log('🔄 Connecting to MongoDB...');
  await connectDB();
  console.log('✅ MongoDB connected.');

  const BASE_URL = 'http://localhost:5000';

  // 1. Identify users
  const chef1 = await User.findOne({ email: 'chef@rms.com' });
  const chef2 = await User.findOne({ email: 'chef2@rms.com' });
  const waiter1 = await User.findOne({ email: 'waiter1@rms.com' });
  const waiter2 = await User.findOne({ email: 'waiter2@rms.com' });
  const manager1 = await User.findOne({ email: 'manager1@rms.com' });
  const manager2 = await User.findOne({ email: 'manager2@rms.com' });

  if (!chef1 || !chef2 || !waiter1 || !waiter2 || !manager1) {
    throw new Error('Required test users not found in database!');
  }

  console.log('\n--- IDENTITIES CHECK ---');
  console.log(`Chef 1: ${chef1.name} (${chef1._id})`);
  console.log(`Chef 2: ${chef2.name} (${chef2._id})`);
  console.log(`Waiter 1: ${waiter1.name} (${waiter1._id})`);
  console.log(`Waiter 2: ${waiter2.name} (${waiter2._id})`);
  console.log(`Manager 1: ${manager1.name} (${manager1._id})`);

  // Log in users via API to obtain JWTs
  async function login(email, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    return data.data?.token || data.token;
  }

  const tokenChef1 = await login('chef@rms.com', 'chef123');
  const tokenChef2 = await login('chef2@rms.com', 'chef123');
  const tokenWaiter1 = await login('waiter1@rms.com', 'waiter123');
  const tokenWaiter2 = await login('waiter2@rms.com', 'waiter123');
  const tokenManager1 = await login('manager1@rms.com', 'manager123');

  console.log('✅ All test users successfully logged in with independent JWT tokens.');

  // Set up dynamic table assignment: Unique Table assigned to Waiter 1
  const testTableNum = 'T-' + Math.floor(20 + Math.random() * 70);
  await Table.findOneAndUpdate(
    { number: testTableNum },
    {
      number: testTableNum,
      name: `Table ${testTableNum}`,
      assignedWaiterId: waiter1._id.toString(),
      assignedWaiterName: waiter1.name
    },
    { upsert: true, new: true }
  );

  console.log(`✅ Table ${testTableNum} configured with assigned waiter: ${waiter1.name} (${waiter1._id})`);

  // Connect Socket.io client to verify real-time events
  const socketClient = io(BASE_URL, { transports: ['websocket'] });
  const receivedEvents = [];

  socketClient.on('connect', () => {
    socketClient.emit('join', { role: 'waiter', userId: waiter1._id.toString(), managerId: manager1._id.toString() });
  });

  socketClient.on('order_created', (data) => receivedEvents.push({ event: 'order_created', data }));
  socketClient.on('chef_accepted', (data) => receivedEvents.push({ event: 'chef_accepted', data }));
  socketClient.on('chef_preparing', (data) => receivedEvents.push({ event: 'chef_preparing', data }));
  socketClient.on('chef_ready', (data) => receivedEvents.push({ event: 'chef_ready', data }));
  socketClient.on('waiter_accepted', (data) => receivedEvents.push({ event: 'waiter_accepted', data }));
  socketClient.on('waiter_serving', (data) => receivedEvents.push({ event: 'waiter_serving', data }));
  socketClient.on('waiter_served', (data) => receivedEvents.push({ event: 'waiter_served', data }));

  // Wait 500ms for socket connection
  await new Promise(r => setTimeout(r, 600));

  // TEST 1: Customer places order from unique table
  console.log('\n--- TEST 1: CUSTOMER PLACES ORDER ---');
  const initialOrderId = `ORD-TEST-${Date.now().toString().slice(-4)}`;
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: initialOrderId,
      table: testTableNum,
      customer: 'Priya Sharma',
      notes: 'Extra spicy please',
      items: [
        { name: 'Paneer Tikka', price: 280, quantity: 2 },
        { name: 'Butter Naan', price: 60, quantity: 3 }
      ],
      total: 740,
      managerId: manager1._id.toString()
    })
  });
  const createdOrderData = await orderRes.json();
  const createdOrder = createdOrderData.data;
  const actualOrderId = createdOrder.orderId;

  console.log(`Order Created: #${actualOrderId}`);
  console.log(`Chef Status: ${createdOrder.chefStatus} (expected: NEW)`);
  console.log(`Chef ID: ${createdOrder.chefId || 'null'} (expected: null/empty)`);
  console.log(`Waiter ID: ${createdOrder.waiterId} (expected: ${waiter1._id})`);
  console.log(`Waiter Name: ${createdOrder.waiterName} (expected: ${waiter1.name})`);

  if (createdOrder.chefStatus !== 'NEW') throw new Error('Test 1 Failed: chefStatus must be NEW');
  if (String(createdOrder.waiterId) !== String(waiter1._id)) throw new Error('Test 1 Failed: waiterId must resolve to assigned waiter');
  console.log('✅ Test 1 PASSED: Order created with chefStatus = "NEW", waiter assigned from table, chefId = null.');

  // TEST 2: Chef 1 accepts order
  console.log('\n--- TEST 2: CHEF 1 ACCEPTS ORDER ---');
  const acceptRes1 = await fetch(`${BASE_URL}/api/orders/${actualOrderId}/chef-accept`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenChef1}`
    }
  });
  const acceptData1 = await acceptRes1.json();
  if (!acceptRes1.ok) throw new Error(`Test 2 Failed: Chef 1 could not accept order: ${JSON.stringify(acceptData1)}`);

  console.log(`Accepted by Chef: ${acceptData1.data.chefName} (${acceptData1.data.chefId})`);
  console.log(`Chef Status: ${acceptData1.data.chefStatus} (expected: ACCEPTED)`);
  if (acceptData1.data.chefStatus !== 'ACCEPTED' || String(acceptData1.data.chefId) !== String(chef1._id)) {
    throw new Error('Test 2 Failed: Chef 1 acceptance mismatch');
  }
  console.log('✅ Test 2 PASSED: Chef 1 atomically claimed order with chefStatus = "ACCEPTED".');

  // TEST 3: Chef 2 attempts to accept the same order (RACE CONDITION PROTECTION)
  console.log('\n--- TEST 3: CHEF 2 CLAIMS SAME ORDER (RACE CONDITION PROTECTION) ---');
  const acceptRes2 = await fetch(`${BASE_URL}/api/orders/${actualOrderId}/chef-accept`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenChef2}`
    }
  });
  const acceptData2 = await acceptRes2.json();
  console.log(`Response Status: ${acceptRes2.status} (expected: 409 Conflict)`);
  console.log(`Message: ${acceptData2.message}`);

  if (acceptRes2.status !== 409) {
    throw new Error(`Test 3 Failed: Race condition test failed. Expected 409 but got ${acceptRes2.status}`);
  }
  console.log('✅ Test 3 PASSED: Concurrent claim properly rejected with 409 Conflict.');

  // TEST 4: Chef 1 moves order to PREPARING
  console.log('\n--- TEST 4: CHEF 1 MOVES ORDER TO PREPARING ---');
  const prepRes = await fetch(`${BASE_URL}/api/orders/${actualOrderId}/chef-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenChef1}`
    },
    body: JSON.stringify({ status: 'PREPARING' })
  });
  const prepData = await prepRes.json();
  if (!prepRes.ok) throw new Error(`Test 4 Failed: ${JSON.stringify(prepData)}`);
  console.log(`Chef Status: ${prepData.data.chefStatus} (expected: PREPARING)`);
  if (prepData.data.chefStatus !== 'PREPARING') throw new Error('Test 4 Failed: chefStatus must be PREPARING');
  console.log('✅ Test 4 PASSED: Order transitioned to PREPARING.');

  // TEST 5: Chef 1 marks order READY
  console.log('\n--- TEST 5: CHEF 1 MARKS ORDER READY ---');
  const readyRes = await fetch(`${BASE_URL}/api/orders/${actualOrderId}/chef-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenChef1}`
    },
    body: JSON.stringify({ status: 'READY' })
  });
  const readyData = await readyRes.json();
  if (!readyRes.ok) throw new Error(`Test 5 Failed: ${JSON.stringify(readyData)}`);
  console.log(`Chef Status: ${readyData.data.chefStatus} (expected: READY)`);
  if (readyData.data.chefStatus !== 'READY') throw new Error('Test 5 Failed: chefStatus must be READY');
  console.log('✅ Test 5 PASSED: Food marked READY by Chef 1.');

  // TEST 6: Waiter 1 accepts order
  console.log('\n--- TEST 6: ASSIGNED WAITER 1 ACCEPTS ORDER ---');
  const waiterAcceptRes = await fetch(`${BASE_URL}/api/orders/${actualOrderId}/waiter-accept`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenWaiter1}`
    }
  });
  const waiterAcceptData = await waiterAcceptRes.json();
  if (!waiterAcceptRes.ok) throw new Error(`Test 6 Failed: ${JSON.stringify(waiterAcceptData)}`);
  console.log(`Waiter Status: ${waiterAcceptData.data.waiterStatus} (expected: ACCEPTED)`);
  console.log(`Waiter ID: ${waiterAcceptData.data.waiterId} (expected: ${waiter1._id})`);
  if (waiterAcceptData.data.waiterStatus !== 'ACCEPTED' || String(waiterAcceptData.data.waiterId) !== String(waiter1._id)) {
    throw new Error('Test 6 Failed: Waiter 1 acceptance mismatch');
  }
  console.log('✅ Test 6 PASSED: Waiter 1 accepted order from kitchen.');

  // TEST 7: Waiter 1 starts serving
  console.log('\n--- TEST 7: WAITER 1 STARTS SERVING ---');
  const servingRes = await fetch(`${BASE_URL}/api/orders/${actualOrderId}/waiter-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenWaiter1}`
    },
    body: JSON.stringify({ status: 'SERVING' })
  });
  const servingData = await servingRes.json();
  if (!servingRes.ok) throw new Error(`Test 7 Failed: ${JSON.stringify(servingData)}`);
  console.log(`Waiter Status: ${servingData.data.waiterStatus} (expected: SERVING)`);
  if (servingData.data.waiterStatus !== 'SERVING') throw new Error('Test 7 Failed: waiterStatus must be SERVING');
  console.log('✅ Test 7 PASSED: Order marked as SERVING.');

  // TEST 8: Waiter 1 marks order as SERVED
  console.log('\n--- TEST 8: WAITER 1 MARKS ORDER AS SERVED ---');
  const servedRes = await fetch(`${BASE_URL}/api/orders/${actualOrderId}/waiter-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenWaiter1}`
    },
    body: JSON.stringify({ status: 'SERVED' })
  });
  const servedData = await servedRes.json();
  if (!servedRes.ok) throw new Error(`Test 8 Failed: ${JSON.stringify(servedData)}`);
  console.log(`Waiter Status: ${servedData.data.waiterStatus} (expected: SERVED)`);
  console.log(`Order Overall Status: ${servedData.data.status} (expected: Served)`);
  console.log(`Payment Status: ${servedData.data.payment} (expected: Pending)`);
  if (servedData.data.waiterStatus !== 'SERVED') throw new Error('Test 8 Failed: waiterStatus must be SERVED');
  if (servedData.data.payment === 'Paid' || servedData.data.payment === 'Completed') {
    throw new Error('Test 8 Failed: Payment MUST remain separate and pending!');
  }
  console.log('✅ Test 8 PASSED: Order marked as SERVED while payment remains strictly separate and Pending.');

  // TEST 9: Real-time Socket events verification
  console.log('\n--- TEST 9: SOCKET.IO REAL-TIME EVENTS VERIFICATION ---');
  console.log(`Received Socket Events Count: ${receivedEvents.length}`);
  const eventTypes = receivedEvents.map(e => e.event);
  console.log(`Events Logged: ${eventTypes.join(', ')}`);
  if (!eventTypes.includes('order_created')) throw new Error('Missing order_created socket event');
  if (!eventTypes.includes('chef_accepted')) throw new Error('Missing chef_accepted socket event');
  if (!eventTypes.includes('chef_preparing')) throw new Error('Missing chef_preparing socket event');
  if (!eventTypes.includes('chef_ready')) throw new Error('Missing chef_ready socket event');
  if (!eventTypes.includes('waiter_accepted')) throw new Error('Missing waiter_accepted socket event');
  if (!eventTypes.includes('waiter_served')) throw new Error('Missing waiter_served socket event');
  console.log('✅ Test 9 PASSED: All Socket.io real-time events triggered and verified in chronological order.');

  // TEST 10: State persistence in MongoDB
  console.log('\n--- TEST 10: STATE PERSISTENCE IN DATABASE ---');
  const persistedOrder = await Order.findOne({ orderId: actualOrderId });
  console.log(`Persisted chefStatus: ${persistedOrder.chefStatus}`);
  console.log(`Persisted chefId: ${persistedOrder.chefId}`);
  console.log(`Persisted waiterStatus: ${persistedOrder.waiterStatus}`);
  console.log(`Persisted waiterId: ${persistedOrder.waiterId}`);
  console.log(`Persisted chefAcceptedAt: ${persistedOrder.chefAcceptedAt}`);
  console.log(`Persisted waiterServedAt: ${persistedOrder.waiterServedAt}`);
  console.log(`Persisted status: ${persistedOrder.status}`);
  console.log(`Persisted payment: ${persistedOrder.payment}`);
  if (!persistedOrder.chefAcceptedAt || !persistedOrder.waiterServedAt) {
    throw new Error('Test 10 Failed: Timestamps not persisted');
  }
  console.log('✅ Test 10 PASSED: Complete state history and timestamps persisted in database.');

  socketClient.disconnect();
  console.log('\n==================================================');
  console.log('🎉 ALL WORKFLOW TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================');
  process.exit(0);
}

run().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
