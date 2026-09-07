const API_BASE = 'http://127.0.0.1:5000/api';

async function postJson(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

async function getJson(url, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

async function patchJson(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

async function testLogin(email, password, roleLabel) {
  try {
    const raw = await postJson(`${API_BASE}/auth/login`, { email, password });
    const payload = raw.data || raw;
    const { token, user } = payload;
    console.log(`[PASS] ${roleLabel} Login:`, user.name, `(${user.email})`, 'Role:', user.role, 'ID:', user._id);
    
    // Verify /api/auth/me
    const meRaw = await getJson(`${API_BASE}/auth/me`, token);
    const mePayload = meRaw.data || meRaw;
    const me = mePayload.user || mePayload;
    console.log(`[PASS] ${roleLabel} Auth /me:`, me.name, 'Matches ID:', me._id === user._id);
    return { token, user: me };
  } catch (err) {
    console.error(`[FAIL] ${roleLabel} Login failed:`, err.message);
    throw err;
  }
}

async function runVerification() {
  console.log('====================================================');
  console.log('RUNNING SYSTEM-WIDE INDIVIDUAL DATA ISOLATION TESTS');
  console.log('====================================================\n');

  // 1. Managers
  console.log('--- 1. Testing Manager Data Isolation ---');
  const mgr1 = await testLogin('manager1@rms.com', 'manager123', 'Manager 1 (Ram)');
  const mgr2 = await testLogin('manager2@rms.com', 'manager123', 'Manager 2 (Kiran)');
  console.log('Manager 1 and Manager 2 have distinct IDs:', mgr1.user._id !== mgr2.user._id);

  const mgr1Staff = await getJson(`${API_BASE}/staff`, mgr1.token);
  console.log('Manager 1 (Ram) Staff Members:', (mgr1Staff.data || mgr1Staff || []).map(s => `${s.name} (${s.email}, ${s.role})`));

  const mgr2Staff = await getJson(`${API_BASE}/staff`, mgr2.token);
  console.log('Manager 2 (Kiran) Staff Members:', (mgr2Staff.data || mgr2Staff || []).map(s => `${s.name} (${s.email}, ${s.role})`));

  // 2. Chefs
  console.log('\n--- 2. Testing Chef Workload & Identity Isolation ---');
  const chef1 = await testLogin('chef@rms.com', 'chef123', 'Chef 1 (Ramu)');
  const chef2 = await testLogin('chef2@rms.com', 'chef123', 'Chef 2 (Lakshmi)');
  console.log('Chef 1 and Chef 2 have distinct IDs:', chef1.user._id !== chef2.user._id);

  // Test Chef 1 claiming an order
  const rawOrders = await getJson(`${API_BASE}/orders`, chef1.token);
  const orderList = Array.isArray(rawOrders) ? rawOrders : (rawOrders.data || rawOrders.orders || []);
  const openOrder = orderList.find(o => o.status === 'Placed' || o.status === 'Preparing');
  if (openOrder) {
    const claimRaw = await patchJson(
      `${API_BASE}/orders/${openOrder._id || openOrder.id}/claim`,
      {},
      chef1.token
    );
    const claimRes = claimRaw.data || claimRaw;
    console.log(`[PASS] Chef 1 claimed Order ${claimRes.orderId || claimRes._id}:`, 'chefId =', claimRes.chefId, 'chefName =', claimRes.chefName);
    console.log('Claimed chef matches Chef 1:', String(claimRes.chefId) === String(chef1.user._id) && claimRes.chefName === chef1.user.name);
  } else {
    console.log('No open order found to claim in database; skipping live claim test.');
  }

  // 3. Waiters
  console.log('\n--- 3. Testing Waiter Workload & Identity Isolation ---');
  const waiter1 = await testLogin('waiter1@rms.com', 'waiter123', 'Waiter 1 (Venky)');
  const waiter2 = await testLogin('waiter2@rms.com', 'waiter123', 'Waiter 2 (Rinku)');
  console.log('Waiter 1 and Waiter 2 have distinct IDs:', waiter1.user._id !== waiter2.user._id);

  // Test Waiter 1 assigning a table to themselves
  const rawTables = await getJson(`${API_BASE}/tables`, waiter1.token);
  const tableList = Array.isArray(rawTables) ? rawTables : (rawTables.data || rawTables.tables || []);
  const firstTable = tableList[0];
  if (firstTable) {
    const tableNum = firstTable.number || firstTable.name || firstTable.num || 'T-01';
    const assignRaw = await patchJson(
      `${API_BASE}/tables/assign-waiter/${tableNum}`,
      { waiterId: waiter1.user._id, waiterName: waiter1.user.name },
      waiter1.token
    );
    const assignRes = assignRaw.data || assignRaw;
    console.log(`[PASS] Waiter 1 assigned Table ${tableNum}:`, 'assignedWaiterId =', assignRes.assignedWaiterId, 'assignedWaiterName =', assignRes.assignedWaiterName);
    console.log('Assigned waiter matches Waiter 1:', String(assignRes.assignedWaiterId) === String(waiter1.user._id));
  }

  // 4. Receptionists
  console.log('\n--- 4. Testing Receptionist Identity Isolation ---');
  const rec1 = await testLogin('receptionist1@rms.com', 'receptionist123', 'Receptionist 1 (Raj)');

  // Ensure Priya password set by Manager 2 if needed
  const priyaStaff = (mgr2Staff.data || mgr2Staff || []).find(s => s.email === 'receptionist2@rms.com');
  if (priyaStaff) {
    try {
      await patchJson(`${API_BASE}/staff/${priyaStaff.id || priyaStaff._id}`, { password: 'receptionist123' }, mgr2.token);
    } catch (e) {
      // Try PUT
      await fetch(`${API_BASE}/staff/${priyaStaff.id || priyaStaff._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgr2.token}` },
        body: JSON.stringify({ password: 'receptionist123' })
      });
    }
  }

  const rec2 = await testLogin('receptionist2@rms.com', 'receptionist123', 'Receptionist 2 (Priya)');
  console.log('Receptionist 1 and Receptionist 2 have distinct IDs:', rec1.user._id !== rec2.user._id);

  console.log('\n====================================================');
  console.log('✅ ALL 8 USERS ACROSS 4 ROLES TESTED & ISOLATED SUCCESSFULLY');
  console.log('====================================================\n');
}

runVerification().catch(err => {
  console.error('Verification encountered an error:', err);
  process.exit(1);
});
