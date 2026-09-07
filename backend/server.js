const dotenv = require('dotenv');
const connectDB = require('./config/db');
const app = require('./app');

// Load environment configuration
dotenv.config();

// Connect to Database
connectDB();

const http = require('http');
const { initSocket } = require('./socket');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Backend running with Socket.io on port ${PORT}`);
});

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  server.close(() => process.exit(1));
});
