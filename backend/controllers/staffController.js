const User = require('../models/User');

const getStaff = async (req, res) => {
  try {
    const staff = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(staff);
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

    // Check if staff member already exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: `Staff member with email "${data.email}" already exists.` });
    }

    // Auto-generate Formatted Employee ID (e.g. RMSC-01 for Chef, RMSM-01 for Manager, RMSW-01 for Waiter, RMSR-01 for Receptionist)
    if (!data.empId || !data.empId.startsWith('RMS')) {
      const prefix = role.includes('Chef') ? 'RMSC' : 
                     role.includes('Receptionist') ? 'RMSR' :
                     role.includes('Manager') ? 'RMSM' : 
                     role.includes('Waiter') ? 'RMSW' : 'RMSA';
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
    Object.assign(member, req.body);
    await member.save();
    res.json(member);
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

module.exports = { getStaff, createStaff, updateStaff, deleteStaff };
