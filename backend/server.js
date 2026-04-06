const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
require('dotenv').config();

const inboxRoutes  = require('./routes/inboxRoutes');
const emailRoutes  = require('./routes/emailRoutes');
const { setupCronJobs } = require('./utils/cronJobs');
const { globalRateLimiter } = require('./middlewares/rateLimiter');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));
app.use(globalRateLimiter);

// Make io accessible in controllers
app.set('io', io);

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', inboxRoutes);
app.use('/api', emailRoutes);
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── Socket.io ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🟢 Client connected: ${socket.id}`);

  socket.on('join_inbox',  (inboxId) => {
    socket.join(inboxId);
    console.log(`   └─ ${socket.id} joined inbox [${inboxId}]`);
  });
  socket.on('leave_inbox', (inboxId) => socket.leave(inboxId));
  socket.on('disconnect',  () => console.log(`🔴 Disconnected: ${socket.id}`));
});

// ── Server Start ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

setupCronJobs(io);
server.listen(PORT, () =>
  console.log(`🚀 TempVault backend running on http://localhost:${PORT}`)
);

module.exports = { app, io };
