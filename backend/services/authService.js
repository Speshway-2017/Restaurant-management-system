const userRepository = require('../repositories/userRepository');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');

class AuthService {
  async login(email, password) {
    if (!email || !password) {
      throw new Error('Invalid email or password');
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Ensure default system accounts exist in database if not created
    await this.ensureDefaultUsersExist();

    // 2. Find user in MongoDB (case insensitive exact match by email)
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${cleanEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // 3. Verify password against stored hash/password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // 4. Generate JWT Token with exact user ID
    const token = generateToken(user._id, user.role);

    const userPayload = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      branch: user.branch || '',
      empId: user.empId || ''
    };

    return {
      user: userPayload,
      role: user.role,
      token,
      ...userPayload
    };
  }

  async ensureDefaultUsersExist() {
    try {
      const defaults = [
        {
          name: 'Manager Ram',
          email: 'manager1@rms.com',
          password: 'manager123',
          role: 'Manager',
          phone: '+91 98765 12345',
          branch: 'Jubilee Hills (Main Branch)',
          empId: 'RMSM-01'
        },
        {
          name: 'Manager Kiran',
          email: 'manager2@rms.com',
          password: 'manager123',
          role: 'Manager',
          phone: '+91 98765 54321',
          branch: 'Jubilee Hills (Main Branch)',
          empId: 'RMSM-02'
        },
        {
          name: 'Chef Srikanth',
          email: 'admin@flavorakitchen.in',
          password: 'admin123password',
          role: 'Admin',
          phone: '+91 98765 43210',
          branch: 'Jubilee Hills (Main Branch)',
          empId: 'FLV-EMP-101'
        }
      ];

      for (const d of defaults) {
        const exists = await User.findOne({ email: d.email });
        if (!exists) {
          await User.create(d);
        }
      }
    } catch (err) {
      console.error('Error ensuring default users exist:', err.message);
    }
  }

  async forgotPassword(email) {
    if (!email) {
      throw new Error('Please enter a valid email address');
    }

    const cleanEmail = String(email).trim().toLowerCase();
    await this.ensureDefaultUsersExist();

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${cleanEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
    });

    if (!user) {
      throw new Error('No registered account was found with this email address.');
    }

    // Generate 6-digit numeric OTP for security & ease of entry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    user.resetPasswordToken = otp;
    user.resetPasswordExpires = expires;
    await user.save();

    console.log(`[PASSWORD RESET SERVICE] Reset OTP generated for ${cleanEmail}: ${otp}`);

    return {
      message: 'Password reset OTP sent successfully',
      email: user.email,
      otp // Included for demo/test UI display
    };
  }

  async resetPassword(email, otp, newPassword) {
    if (!email || !otp || !newPassword) {
      throw new Error('Email, OTP code, and new password are required');
    }

    if (String(newPassword).length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${cleanEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.resetPasswordToken || String(user.resetPasswordToken).trim() !== cleanOtp) {
      throw new Error('Invalid or expired password reset OTP. Please check the code and try again.');
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new Error('Password reset OTP has expired. Please request a new one.');
    }

    // Update password (pre-save hook will hash password)
    user.password = String(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    console.log(`[PASSWORD RESET SERVICE] Password successfully updated for ${cleanEmail}`);

    return {
      message: 'Password reset successful. You can now sign in with your new password.'
    };
  }

  async getProfile(id) {
    return await userRepository.findById(id);
  }
}

module.exports = new AuthService();
