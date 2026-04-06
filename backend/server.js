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

// --- Background Poller for Mail.tm ---
const mailService = require('./utils/mailService');
const { extractOTP } = require('./services/otpService');

/**
 * Format Mail.tm message to summary format
 */
const toSummary = (msg) => ({
  id:         msg.id,
  from:       msg.from.address,
  fromName:   msg.from.name || 'Unknown',
  subject:    msg.subject || '(No Subject)',
  preview:    msg.intro || 'No preview available',
  otpCode:    extractOTP(msg.intro, '', msg.subject),
  isRead:     msg.seen,
  size:       msg.size,
  receivedAt: msg.createdAt,
});

const startMailPoller = (io) => {
  setInterval(async () => {
    // Only poll for inboxes that have active socket connections
    const activeRooms = io.sockets.adapter.rooms;
    
    for (const [inboxId, room] of activeRooms.entries()) {
      // Sockets auto-join a room with their own ID, so we check if it's a valid uuid for an inbox
      const inbox = require('./utils/memoryStore').getInbox(inboxId);
      if (inbox && inbox.token && room.size > 0) {
        try {
          const messages = await mailService.getMessages(inbox.token);
          
          // Check for new messages
          const prevCount = inbox.emailCount || 0;
          if (messages.length > prevCount) {
            // Found new messages!
            const newMessages = messages.slice(0, messages.length - prevCount);
            newMessages.forEach(msg => {
              io.to(inboxId).emit('new_email', {
                ...toSummary(msg),
                inboxId,
              });
            });
            inbox.emailCount = messages.length;
          }
        } catch (err) {
          // Silent fail for background poller
        }
      }
    }
  }, 3000); // Poll every 3 seconds for fast response
};

// --- Server Start ---
const PORT = process.env.PORT || 5000;

setupCronJobs(io);
startMailPoller(io); // Start the real-time mail listener

server.listen(PORT, () =>
  console.log(`🚀 TempVault backend running on http://localhost:${PORT}`)
);

module.exports = { app, io };
