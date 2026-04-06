# ⚡ TempVault — Disposable Email, Reinvented

A production-ready temporary email application with real-time inbox, OTP detection, and a premium startup-grade UI.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) OR a MongoDB Atlas URI

### 1. Backend Setup
```bash
cd backend
cp .env.example .env      # edit if needed
npm install
npm run dev               # runs on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev               # runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 🏗️ Project Structure

```
tempvault/
├── backend/
│   ├── server.js               # Express + Socket.io entry point
│   ├── models/
│   │   ├── Inbox.js            # MongoDB inbox schema (TTL auto-expiry)
│   │   └── Email.js            # MongoDB email schema
│   ├── controllers/
│   │   ├── inboxController.js  # Generate, get, delete inbox
│   │   └── emailController.js  # CRUD + webhook + simulation
│   ├── routes/
│   │   ├── inboxRoutes.js
│   │   └── emailRoutes.js
│   ├── services/
│   │   └── otpService.js       # OTP extraction from email content
│   ├── middlewares/
│   │   └── rateLimiter.js      # 3-tier rate limiting
│   └── utils/
│       ├── emailGenerator.js   # Human-readable address generation
│       └── cronJobs.js         # Cleanup + expiry notification jobs
└── frontend/
    └── src/
        ├── App.jsx
        ├── index.css           # Full design system (CSS tokens)
        ├── context/
        │   └── AppContext.jsx  # Global state + Socket.io + all actions
        ├── hooks/
        │   ├── useClipboard.js
        │   └── useTheme.js
        └── components/
            ├── Navbar.jsx
            ├── EmailBox.jsx    # Address display + copy + custom username
            ├── InboxPanel.jsx  # Real-time email list
            ├── EmailViewer.jsx # Full email + OTP banner + download
            ├── OTPBadge.jsx    # OTP pill + banner
            ├── SkeletonLoader.jsx
            ├── EmptyState.jsx
            └── ToastStack.jsx
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate-email` | Create new inbox |
| GET | `/api/inbox/:inboxId` | Get inbox details |
| GET | `/api/domains` | List available domains |
| DELETE | `/api/inbox/:inboxId` | Delete inbox + all emails |
| GET | `/api/emails/:inboxId` | List emails (summary, no body) |
| GET | `/api/email/:id` | Get full email |
| DELETE | `/api/email/:id` | Delete single email |
| POST | `/api/webhook/receive` | Mailgun webhook (production) |
| POST | `/api/simulate-email/:inboxId` | Simulate email (demo) |

### WebSocket Events
| Event | Direction | Payload |
|-------|-----------|---------|
| `join_inbox` | Client → Server | `inboxId` |
| `new_email` | Server → Client | email summary object |
| `inbox_expiring` | Server → Client | `{ minutesLeft, expiresAt }` |
| `inbox_deleted` | Server → Client | `{ inboxId }` |

---

## 🌐 Production Deployment

### Email Receiving (Mailgun)
1. Add your domain in Mailgun dashboard
2. Set MX records to point to Mailgun SMTP
3. Add a Route: match `.*@yourdomain.com` → forward to `https://yourbackend.com/api/webhook/receive`
4. Set `MAILGUN_DOMAIN` in `.env`

### Environment Variables
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/tempvault
FRONTEND_URL=https://yourapp.vercel.app
EMAIL_DOMAINS=yourdomain.com
INBOX_EXPIRY_MINUTES=60
MAX_EMAILS_PER_INBOX=50
```

### Deploy
- **Frontend** → [Vercel](https://vercel.com) (drag & drop `frontend/` folder)
- **Backend** → [Railway](https://railway.app) or [Render](https://render.com)
- **Database** → [MongoDB Atlas](https://mongodb.com/atlas) (free tier)

---

## ✨ Features
- ⚡ Instant disposable email generation
- 🔄 Real-time inbox via Socket.io (zero refresh)
- 🔐 Smart OTP detection & one-click copy
- 🌙 Dark + Light mode with system preference
- ✎ Custom username support with domain selection
- ⏱ Auto-expiry with live countdown
- 📥 Download emails as HTML or plain text
- 🎨 Premium design system (CSS tokens, Inter + JetBrains Mono)
- 💀 Skeleton loading states
- 🔒 Rate limiting, input validation, HTML sanitization
