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
const smsRoutes = require('./routes/smsRoutes');
app.use('/api/sms', smsRoutes);
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
const mailService = require('./services/mailTmService');
const { extractOTP } = require('./services/otpService');
const { inboxStore } = require('./controllers/inboxController');

/**
 * Format Mail.tm message to summary format
 */
const toSummary = (msg) => ({
  id:         msg.id,
  from:       typeof msg.from === 'object' ? msg.from.address : msg.from,
  fromName:   (typeof msg.from === 'object' ? msg.from.name : msg.from) || 'Unknown',
  subject:    msg.subject || '(No Subject)',
  preview:    msg.intro || 'No preview available',
  otpCode:    extractOTP(msg.intro || '', '', msg.subject || ''),
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
      const inbox = inboxStore.get(inboxId);
      if (inbox && inbox.token && room.size > 0) {
        try {
          const messages = await mailService.getMessages(inbox.token);
          
          // Initialize seenIds if missing (to avoid old messages re-triggering as new)
          if (!inbox.seenIds) {
            inbox.seenIds = new Set(messages.map(m => m.id));
            // Just updated seen logic, we don't need to emit the initial fetch
          } else {
            // Find messages that haven't been seen yet
            const newMessages = [];
            messages.forEach(msg => {
              if (!inbox.seenIds.has(msg.id)) {
                inbox.seenIds.add(msg.id);
                newMessages.push(msg);
              }
            });

            // Emit safely (reverse to send oldest-new first if multiple arrived)
            newMessages.reverse().forEach(msg => {
              io.to(inboxId).emit('new_email', {
                ...toSummary(msg),
                inboxId,
              });
            });
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
