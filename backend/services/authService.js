const userRepository = require('../repositories/userRepository');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');

class AuthService {
  async login(email, password) {
    if (!email || !password) {
      throw new Error('Invalid email or password');
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Ensure default system accounts exist in database
    await this.ensureDefaultUsersExist();

    // 2. Find user in MongoDB (case insensitive)
    let user = await User.findOne({
      email: { $regex: new RegExp(`^${cleanEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
    });

    // 3. If user is not found, check if role keyword matches email and register role account dynamically
    if (!user) {
      if (cleanEmail.includes('admin')) {
        user = await User.create({
          name: 'System Admin',
          email: cleanEmail,
          password: password || 'admin123',
          role: 'Admin',
          phone: '+91 98765 43210',
          branch: 'Jubilee Hills (Main Branch)',
          empId: 'FLV-EMP-101'
        });
      } else if (cleanEmail.includes('manager') || cleanEmail.includes('rmsm')) {
        user = await User.create({
          name: 'Ramesh Sharma',
          email: cleanEmail,
          password: password || 'manager123',
          role: 'Manager',
          phone: '+91 98765 12345',
          branch: 'Jubilee Hills (Main Branch)',
          empId: 'RMSM-01'
        });
      } else if (cleanEmail.includes('chef')) {
        user = await User.create({
          name: 'Master Chef Vikram',
          email: cleanEmail,
          password: password || 'chef123',
          role: 'Chef',
          phone: '+91 98765 43212',
          branch: 'Jubilee Hills (Main Branch)',
          empId: 'CHEF-01'
        });
      } else if (cleanEmail.includes('waiter')) {
        user = await User.create({
          name: 'Suresh Kumar',
          email: cleanEmail,
          password: password || 'waiter123',
          role: 'Waiter',
          phone: '+91 98765 88990',
          branch: 'Jubilee Hills (Main Branch)',
          empId: 'RMSW-01'
        });
      } else if (cleanEmail.includes('reception') || cleanEmail.includes('host')) {
        user = await User.create({
          name: 'Ananya Roy',
          email: cleanEmail,
          password: password || 'receptionist123',
          role: 'Receptionist',
          phone: '+91 98765 77665',
          branch: 'Jubilee Hills (Main Branch)',
          empId: 'RMSR-01'
        });
      }
    }

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // 4. Verify password against stored hash/password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // 5. Generate JWT Token
    const token = generateToken(user._id, user.role);

    const userPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      branch: user.branch || ''
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
          name: 'Chef Srikanth',
          email: 'admin@flavorakitchen.in',
          password: 'admin123password',
          role: 'Admin',
          phone: '+91 98765 43210',
          branch: 'Jubilee Hills (Main Branch)',
          empId: 'FLV-EMP-101'
        },
        {
          name: 'System Admin',
          email: 'admin@rms.com',
          password: 'admin123password',
          role: 'Admin',
          phone: '+91 98765 43210',
          branch: 'Jubilee Hills (Main Branch)',
          empId: 'FLV-EMP-100'
        },
        {
          name: 'Ramesh Sharma',
          email: 'manager@flavorakitchen.in',
          password: 'manager123password',
          role: 'Manager',
          phone: '+91 98765 12345',
          branch: 'Jubilee Hills (Main Branch)',
          empId: 'RMSM-01'
        },
        {
          name: 'Master Chef Vikram',
          email: 'chef@flavorakitchen.in',
          password: 'chef123password',
          role: 'Chef',
          phone: '+91 98765 43212',
          branch: 'Jubilee Hills (Main Branch)',
          empId: 'CHEF-01'
        },
        {
          name: 'Suresh Kumar',
          email: 'waiter@flavorakitchen.in',
          password: 'waiter123password',
          role: 'Waiter',
          phone: '+91 98765 88990',
          branch: 'Jubilee Hills (Main Branch)',
          empId: 'RMSW-01'
        },
        {
          name: 'Ananya Roy',
          email: 'receptionist@flavorakitchen.in',
          password: 'receptionist123password',
          role: 'Receptionist',
          phone: '+91 98765 77665',
          branch: 'Jubilee Hills (Main Branch)',
          empId: 'RMSR-01'
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
