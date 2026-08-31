const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check Endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Flavora Kitchen RestoOS REST API Server Running',
    version: '3.4'
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/tables', require('./routes/tableRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/restaurant/settings', require('./routes/settingsRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/admin/payments', require('./routes/paymentRoutes'));

// Global Error Handler
app.use(errorHandler);

module.exports = app;
