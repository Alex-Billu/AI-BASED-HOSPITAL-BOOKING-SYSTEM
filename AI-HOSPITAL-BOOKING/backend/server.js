const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set('io', io);

// Database connection
const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/emerge_ai';
    console.log('🔄 Attempting to connect to MongoDB...');

    // Set a short timeout for the initial connection attempt
    await mongoose.connect(connUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.log('⚠️ No MongoDB found. Starting Zero-Setup Demo Mode...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();

      await mongoose.connect(mongoUri);
      console.log('✅ In-Memory MongoDB Started');
      console.log('📝 Seeding demo data...');

      // Run seed script logic
      const { seedDatabase } = require('./scripts/seed');
      await seedDatabase();
      console.log('✨ Demo database seeded successfully!');
    } catch (memErr) {
      console.error('❌ Failed to start In-Memory MongoDB:', memErr);
    }
  }
};

connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/ambulance', require('./routes/ambulance'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/blood', require('./routes/blood'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'RED ALERT NETWORK Backend Running', timestamp: new Date() });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on('ambulance-location-update', (data) => {
    io.to(`emergency-${data.emergencyId}`).emit('ambulance-moved', data);
  });

  socket.on('hospital-status-update', (data) => {
    io.emit('hospital-updated', data);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Auto-escalation cron job (runs every 30 seconds)
const { checkEscalations } = require('./services/escalationService');
cron.schedule('*/30 * * * * *', () => {
  checkEscalations(io);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 RED ALERT NETWORK Server running on port ${PORT}`);
});

module.exports = { app, io };
