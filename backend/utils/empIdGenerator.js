const User = require('../models/User');

const getPrefixForRole = (role) => {
  const r = String(role || '').toLowerCase();
  if (r.includes('chef')) return 'RMSC';
  if (r.includes('receptionist') || r.includes('cashier')) return 'RMSR';
  if (r.includes('waiter')) return 'RMSW';
  if (r.includes('manager')) return 'RMSM';
  if (r.includes('admin')) return 'RMSAD';
  return 'RMS';
};

/**
 * Generate next unique sequential Employee ID for a given role (e.g. RMSC-04, RMSW-03)
 * Guarantees uniqueness by finding the max numeric sequence number among all existing users with that prefix.
 */
const getNextEmpId = async (role) => {
  const prefix = getPrefixForRole(role);
  const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  
  // Find all users whose empId matches this prefix pattern
  const users = await User.find({ empId: { $regex: regex } }).select('empId').lean();
  
  let maxNum = 0;
  for (const u of users) {
    const match = String(u.empId || '').match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidateId = `${prefix}-${String(nextNum).padStart(2, '0')}`;

  // Double-check candidateId does not exist (safeguard against concurrent writes)
  while (await User.exists({ empId: candidateId })) {
    nextNum += 1;
    candidateId = `${prefix}-${String(nextNum).padStart(2, '0')}`;
  }

  return candidateId;
};

module.exports = {
  getPrefixForRole,
  getNextEmpId
};
