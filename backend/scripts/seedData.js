const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing
    await User.deleteMany({});
    await MenuItem.deleteMany({});
    await Table.deleteMany({});

    // Seed Admin User
    await User.create({
      name: 'Chef Srikanth',
      email: 'admin@flavorakitchen.in',
      password: 'admin123password',
      role: 'Admin',
      phone: '+91 98765 43210',
      branch: 'Jubilee Hills (Main Branch)',
      empId: 'FLV-EMP-101'
    });

    // Seed Sample Menu Items
    await MenuItem.insertMany([
      { name: 'Special Chicken Dum Biryani', category: 'biryani', price: 490, isVeg: false, spiceLevel: 'Spicy', prepTime: '20 mins', desc: 'Aromatic basmati rice cooked on dum with marinated chicken.', img: '/hero_dish_2.png', isBestseller: true },
      { name: 'Amritsari Paneer Tikka', category: 'starters', price: 320, isVeg: true, spiceLevel: 'Medium', prepTime: '15 mins', desc: 'Cottage cheese cubes marinated in spiced yogurt and grilled.', img: '/carousel_2.png', isBestseller: true },
      { name: 'Classic Butter Chicken', category: 'main-course', price: 440, isVeg: false, spiceLevel: 'Mild', prepTime: '18 mins', desc: 'Tender chicken pieces simmered in rich creamy tomato butter gravy.', img: '/carousel_3.png', isBestseller: false },
      { name: 'Hyderabadi Veg Biryani', category: 'biryani', price: 420, isVeg: true, spiceLevel: 'Medium', prepTime: '18 mins', desc: 'Garden fresh vegetables layered with fragrant saffron rice.', img: '/carousel_1.png', isBestseller: true }
    ]);

    // Seed Sample Tables
    await Table.insertMany([
      { number: 'T-01', name: 'Table 01', seats: 2, section: 'Main Hall', status: 'Available' },
      { number: 'T-02', name: 'Table 02', seats: 4, section: 'Main Hall', status: 'Occupied', currentOrder: 'ORD-8943' },
      { number: 'T-03', name: 'Table 03', seats: 4, section: 'Main Hall', status: 'Available' },
      { number: 'T-04', name: 'Table 04', seats: 6, section: 'VIP Lounge', status: 'Reserved' }
    ]);

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
