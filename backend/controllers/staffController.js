const User = require('../models/User');

const getStaff = async (req, res) => {
  try {
    let query = {};
    if (req.user) {
      const userRole = (req.user.role || '').toLowerCase();
      if (userRole.includes('manager')) {
        query = {
          role: { $ne: 'Admin' },
          $or: [
            { managerId: req.user._id },
            { createdBy: req.user._id }
          ]
        };
      }
    }

    const staff = await User.find(query).select('-password').sort({ createdAt: 1 });

    const roleCounters = {};
    const formattedStaff = staff.map((member) => {
      const role = member.role || 'Manager';
      let prefix = 'RMSM';

      if (role.toLowerCase().includes('waiter')) {
        prefix = 'RMSW';
      } else if (role.toLowerCase().includes('chef')) {
        prefix = 'RMSC';
      } else if (role.toLowerCase().includes('receptionist') || role.toLowerCase().includes('cashier')) {
        prefix = 'RMSR';
      } else if (role.toLowerCase().includes('admin')) {
        prefix = 'RMSA';
      }

      roleCounters[prefix] = (roleCounters[prefix] || 0) + 1;
      const numStr = String(roleCounters[prefix]).padStart(2, '0');
      const expectedEmpId = `${prefix}-${numStr}`;

      const obj = member.toObject();
      obj.id = obj._id;
      if (!obj.empId || !obj.empId.startsWith(prefix)) {
        obj.empId = expectedEmpId;
      }
      obj.shift = obj.scheduledShift || obj.shift || 'Morning (09:00 AM - 05:00 PM)';
      return obj;
    });

    res.json(formattedStaff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const extractLast10Digits = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

const checkPhoneExists = async (req, res) => {
  try {
    const { phone, excludeId } = req.query;
    if (!phone) {
      return res.json({ exists: false });
    }
    const targetLast10 = extractLast10Digits(phone);
    if (targetLast10.length < 10) {
      return res.json({ exists: false, message: 'Phone number must be at least 10 digits.' });
    }

    const query = {
      phone: { $exists: true, $ne: '' }
    };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const usersWithPhone = await User.find(query).select('name email role phone');
    const duplicate = usersWithPhone.find(u => extractLast10Digits(u.phone) === targetLast10);

    if (duplicate) {
      return res.json({
        exists: true,
        message: `Mobile number ${phone} already exists in database (registered to ${duplicate.name} - ${duplicate.role})`,
        duplicateUser: {
          id: duplicate._id,
          name: duplicate.name,
          role: duplicate.role,
          phone: duplicate.phone
        }
      });
    }

    return res.json({ exists: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createStaff = async (req, res) => {
  try {
    const data = { ...req.body };
    const role = data.role || 'Manager';

    if (!data.email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    // Check if staff member with email already exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: `Staff member with email "${data.email}" already exists.` });
    }

    // Check if staff member with mobile number already exists
    if (data.phone) {
      const targetLast10 = extractLast10Digits(data.phone);
      if (targetLast10.length >= 10) {
        const usersWithPhone = await User.find({ phone: { $exists: true, $ne: '' } }).select('name email role phone');
        const duplicate = usersWithPhone.find(u => extractLast10Digits(u.phone) === targetLast10);
        if (duplicate) {
          return res.status(400).json({
            message: `Mobile number ${data.phone} already exists in database (registered to ${duplicate.name} - ${duplicate.role}).`,
            duplicateUser: {
              name: duplicate.name,
              role: duplicate.role,
              phone: duplicate.phone
            }
          });
        }
      }
    }

    // Auto-generate Formatted Employee ID (e.g. RMSM-01 for Manager, RMSW-01 for Waiter, RMSC-01 for Chef, RMSR-01 for Receptionist)
    const prefix = role.toLowerCase().includes('chef') ? 'RMSC' : 
                   role.toLowerCase().includes('receptionist') ? 'RMSR' :
                   role.toLowerCase().includes('waiter') ? 'RMSW' :
                   role.toLowerCase().includes('manager') ? 'RMSM' : 'RMSA';

    if (!data.empId || !data.empId.startsWith(prefix)) {
      const count = await User.countDocuments({ 
        $or: [
          { role: { $regex: role, $options: 'i' } },
          { empId: { $regex: `^${prefix}`, $options: 'i' } }
        ]
      });
      const nextNum = String(count + 1).padStart(2, '0');
      data.empId = `${prefix}-${nextNum}`;
    }

    data.email = data.email.toLowerCase();
    if (req.user) {
      const userRole = (req.user.role || '').toLowerCase();
      if (userRole.includes('manager')) {
        data.managerId = req.user._id;
        data.createdBy = req.user._id;
      }
    }
    const member = await User.create(data);
    res.status(201).json(member);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateStaff = async (req, res) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Check if new mobile number already exists in database for another user
    if (req.body.phone) {
      const targetLast10 = extractLast10Digits(req.body.phone);
      if (targetLast10.length >= 10) {
        const usersWithPhone = await User.find({ _id: { $ne: req.params.id }, phone: { $exists: true, $ne: '' } }).select('name email role phone');
        const duplicate = usersWithPhone.find(u => extractLast10Digits(u.phone) === targetLast10);
        if (duplicate) {
          return res.status(400).json({
            message: `Mobile number ${req.body.phone} already exists in database (registered to ${duplicate.name} - ${duplicate.role}).`
          });
        }
      }
    }

    if (req.body.scheduledShift || req.body.shift) {
      member.scheduledShift = req.body.scheduledShift || req.body.shift;
    }
    if (req.body.checkInTime) member.checkInTime = req.body.checkInTime;
    if (req.body.checkOutTime) member.checkOutTime = req.body.checkOutTime;

    Object.assign(member, req.body);
    await member.save();

    const obj = member.toObject();
    obj.id = obj._id;
    obj.shift = obj.scheduledShift || obj.shift || '09:00 AM – 06:00 PM';
    res.json(obj);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteStaff = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Staff member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStaff, createStaff, updateStaff, deleteStaff, checkPhoneExists };
