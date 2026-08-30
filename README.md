# Code Arena

A full-stack competitive programming platform — browse problems, write and run solutions against real test cases via an online judge, watch premium editorial walkthroughs, and track your submission history. Built as a LeetCode-style practice tool with a full production-grade authentication system.

**Live demo:** [https://code-arena-vert-tau.vercel.app](https://code-arena-vert-tau.vercel.app)

---

## Features

### Problem Solving
- Browse problems filtered by difficulty, tag, and solved status
- In-browser Monaco code editor (C++, Java, JavaScript)
- Run code against visible test cases, or submit for full grading against hidden test cases via [Judge0](https://judge0.com/)
- Submission history per problem
- AI-powered "Chat with AI" doubt-solving assistant for stuck problems

### Authentication
- Email/password signup with **OTP email verification** (Nodemailer + Redis-backed, time-limited codes)
- **Google Sign-In** (One Tap / button) — auto-links to an existing account if the email already exists
- **Forgot password** flow (OTP-based reset)
- **Access + refresh token** session model (short-lived access token, long-lived rotating refresh token, both httpOnly cookies)
- **Logout** (single device) and **logout of all devices** (instantly revokes every active session via a `sessionsValidAfter` cutoff timestamp)
- Rate limiting on OTP requests to prevent spam/abuse

### Premium Editorials (Razorpay)
- Problem editorials (video walkthroughs) are gated behind a one-time premium unlock
- Guests and free users see a locked teaser (thumbnail + duration); premium users and admins see the full video
- Payment flow: create order → Razorpay checkout widget → **server-side HMAC signature verification** (the actual security boundary — payment status is never trusted from the client alone)
- Admins get free access automatically, no payment required

### Admin Panel
- Create, update, and delete problems (full CRUD)
- Problem creation/update **actually executes the reference solution against Judge0** before saving, so a broken reference solution can never be published
- Upload/manage editorial videos (Cloudinary)

---

## Tech Stack

**Frontend**
- React + Vite
- Redux Toolkit (auth, payment, and page-level state)
- Tailwind CSS v4 + daisyUI (custom theme)
- React Hook Form + Zod (form validation)
- Monaco Editor
- Axios (with a token-refresh interceptor)

**Backend**
- Node.js + Express
- MongoDB (Mongoose) — primary data store
- Redis — OTP storage, rate limiting, token blocklist
- JSON Web Tokens (access + refresh)
- bcrypt (password hashing)
- Judge0 (via RapidAPI) — code execution/grading
- Cloudinary — video storage
- Nodemailer (Gmail SMTP) — OTP emails
- Google Identity Services (`google-auth-library`) — OAuth verification
- Razorpay — payments
- Google Gemini — AI doubt-solving

---

## Project Structure

```
leetcode-project/          (backend)
├── src/
│   ├── config/             DB, Redis, Razorpay client setup
│   ├── controllers/        Route handlers (auth, problems, submissions, payments)
│   ├── middleware/         Auth guards, rate limiting
│   ├── models/             Mongoose schemas
│   ├── routes/             Express routers
│   ├── utils/               Token/OTP/Google-auth helpers, Judge0 client
│   └── index.js             App entry point
└── .env

frontend-leetcode/          (frontend)
├── src/
│   ├── components/          Reusable UI (auth forms, admin panel, paywall, etc.)
│   ├── pages/                Route-level views
│   ├── store/                 Redux store config
│   ├── utils/                  Axios client
│   ├── authSlice.js
│   └── paymentSlice.js
└── .env
```

---

## Environment Variables

### Backend (`leetcode-project/.env`)

| Variable | Purpose |
|---|---|
| `PORT_NUMBER` | Local dev port (Render provides its own `PORT` in production) |
| `DB_CONNECT_STRING` | MongoDB Atlas connection string |
| `JWT_KEY` / `JWT_REFRESH_KEY` | Access/refresh token signing secrets |
| `REDIS_PASSWORD` | Redis Cloud auth |
| `RAPIDAPI_KEY` | Judge0 (code execution) |
| `GEMINI_KEY` | AI doubt-solving |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Video storage |
| `EMAIL_USER` / `EMAIL_PASS` | Gmail SMTP for OTP emails (App Password, not your real password) |
| `GOOGLE_CLIENT_ID` | Google Sign-In token verification |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payments |
| `PREMIUM_PRICE_INR` | Editorial unlock price |
| `NODE_ENV` | `production` in deployment — controls cookie `secure`/`sameSite` behavior |
| `CLIENT_URL` | Deployed frontend URL, for CORS |

### Frontend (`frontend-leetcode/.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL |
| `VITE_GOOGLE_CLIENT_ID` | Google Sign-In button |

---

## Running Locally

**Backend**
```bash
cd leetcode-project
npm install
npm run dev        # or: node src/index.js
```

**Frontend**
```bash
cd frontend-leetcode
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:3000` by default (set via `VITE_API_URL`).

---

## Deployment

- **Backend** — deployed on [Render](https://render.com) (Node web service)
- **Frontend** — deployed on [Vercel](https://vercel.com) (static Vite build)
- **Database** — MongoDB Atlas
- **Cache/Session store** — Redis Cloud

Cross-domain auth (frontend and backend on different domains) requires cookies set with `secure: true` and `sameSite: 'none'` in production — handled automatically via the `NODE_ENV` flag.

---

## Security Notes

- Access tokens are short-lived (15 min); refresh tokens rotate on every use and are blocklisted on logout
- Payment verification is done via HMAC-SHA256 signature recomputation server-side — client-reported payment success is never trusted directly
- Hidden test cases are never sent to the client, even for logged-in users — only exposed via a separate admin-only endpoint
- OTPs are single-use, expire after 5 minutes, and are rate-limited per email and per IP
