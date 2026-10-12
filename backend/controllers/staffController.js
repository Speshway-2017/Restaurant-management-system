const User = require('../models/User');
const authService = require('../services/authService');

const getStaff = async (req, res) => {
  try {
    // Ensure default manager accounts exist in DB
    await authService.ensureDefaultUsersExist();

    const { role, includeAll } = req.query;

    let query = {};

    if (includeAll === 'true' || role === 'all') {
      query = {
        role: { $nin: ['Admin', 'admin', 'Super Admin', 'super admin'] }
      };
    } else if (role && role.toLowerCase().includes('manager')) {
      query = {
        role: { $regex: 'manager', $options: 'i' }
      };
    } else if (role && role.toLowerCase() === 'operational') {
      query = {
        role: { $nin: ['Admin', 'admin', 'Manager', 'manager', 'Resto Manager', 'resto manager', 'Super Admin', 'super admin'] }
      };
    } else {
      // Default: Return all non-admin staff users (Managers, Waiters, Chefs, Receptionists)
      query = {
        role: { $nin: ['Admin', 'admin', 'Super Admin', 'super admin'] }
      };
    }

    const staff = await User.find(query).select('-password').sort({ createdAt: 1 });

    const formattedStaff = staff.map((member) => {
      const obj = member.toObject();
      obj.id = obj._id;
      obj.empId = obj.empId || '';
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

    const { getNextEmpId } = require('../utils/empIdGenerator');
    if (data.empId && String(data.empId).trim()) {
      data.empId = String(data.empId).trim().toUpperCase();
      const existingWithEmpId = await User.findOne({ empId: data.empId });
      if (existingWithEmpId) {
        return res.status(400).json({
          message: `Employee ID "${data.empId}" is already assigned to ${existingWithEmpId.name} (${existingWithEmpId.role}).`
        });
      }
    } else {
      data.empId = await getNextEmpId(role);
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

    // Check if new Employee ID already exists for another user
    if (req.body.empId && String(req.body.empId).trim()) {
      const targetEmpId = String(req.body.empId).trim().toUpperCase();
      const duplicateEmpId = await User.findOne({ _id: { $ne: req.params.id }, empId: targetEmpId });
      if (duplicateEmpId) {
        return res.status(400).json({
          message: `Employee ID "${targetEmpId}" is already assigned to ${duplicateEmpId.name} (${duplicateEmpId.role}).`
        });
      }
      req.body.empId = targetEmpId;
    }

    if (req.body.scheduledShift || req.body.shift) {
      member.scheduledShift = req.body.scheduledShift || req.body.shift;
    }
    if (req.body.checkInTime) member.checkInTime = req.body.checkInTime;
    if (req.body.checkOutTime) member.checkOutTime = req.body.checkOutTime;

    if (!req.body.password || !String(req.body.password).trim()) {
      delete req.body.password;
    }

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
