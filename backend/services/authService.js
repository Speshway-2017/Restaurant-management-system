const userRepository = require('../repositories/userRepository');
const generateToken = require('../utils/generateToken');

class AuthService {
  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
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
