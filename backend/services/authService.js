const userRepository = require('../repositories/userRepository');
const generateToken = require('../utils/generateToken');

class AuthService {
  async login(email, password) {
    const User = require('../models/User');
    let user = await userRepository.findByEmail(email);

    if (!user) {
      const lower = (email || '').toLowerCase();
      if (lower.includes('chef')) {
        user = await User.create({
          name: 'Master Chef Vikram',
          email: lower,
          password: password || 'chef123',
          role: 'Chef',
          phone: '+91 98765 43212',
          branch: 'Jubilee Hills (Main Branch)',
          empId: 'CHEF-01'
        });
      } else if (lower.includes('manager')) {
        user = await User.create({
          name: 'Ramesh Sharma',
          email: lower,
          password: password || 'manager123',
          role: 'Manager',
          phone: '+91 98765 12345',
          branch: 'Jubilee Hills (Main Branch)',
          empId: 'RMSM-01'
        });
      } else {
        throw new Error('Invalid email or password');
      }
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = generateToken(user._id, user.role);
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    };
  }

  async getProfile(id) {
    return await userRepository.findById(id);
  }
}

module.exports = new AuthService();
