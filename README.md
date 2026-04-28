# Wallet Admin Dashboard

A web-based admin dashboard for the Insignia crypto-wallet backend. Built with
React + Vite + Tailwind CSS, with Chart.js for the charts and Axios for HTTP.

## Features

- **Authentication** – Username + password login. Backend uses JWT tokens
  (`POST /user`); the password is hashed with SHA-256 in-browser to gate token
  reuse on the same device. New usernames are auto-registered.
- **Dashboard** – Live balance, transaction KPIs, and two Chart.js bar charts:
  - "My top transactions" (vertical bars, green = credit, red = debit)
  - "Top transacting users" (horizontal bars by aggregate debit value)
- **Transactions** – Paginated table of the user's top transactions with:
  - Search by counterparty username
  - Filter chips (All / Credits / Debits)
  - Configurable page size (5 / 10 / 25)

## Tech stack

- React 18 + React Router 6
- Vite (with `/api` dev proxy to the backend, no CORS setup required)
- Tailwind CSS 3
- Axios (with auth header interceptor and 401 redirect)
- Chart.js 4 + react-chartjs-2

## Backend

This frontend talks to the wallet API from the Insignia backend assignment.
The expected endpoints are:

| Method | Path                          | Notes                      |
| ------ | ----------------------------- | -------------------------- |
| POST   | `/user`                       | Register, returns `{ token }` |
| GET    | `/balance`                    | Auth required              |
| POST   | `/topup`                      | Auth required              |
| POST   | `/transfer`                   | Auth required              |
| GET    | `/top_transactions_per_user`  | Auth required              |
| GET    | `/top_users`                  | Auth required              |

The auth header sent on every request is the JWT token directly (matching the
backend's `JwtAuthGuard`).

By default, the dashboard expects the backend at `http://localhost:3000`. The
Vite dev server proxies `/api/*` to that target so the browser never makes a
cross-origin request.

## Getting started

### Prerequisites

- Node.js 18+
- The wallet backend running locally (default `http://localhost:3000`)

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

The app starts on http://localhost:5173 and proxies API calls to the backend.

### Configuration (optional)

Copy `.env.example` to `.env` if you need to override defaults:

```bash
cp .env.example .env
```

- `VITE_API_TARGET` – proxy target used by the Vite dev server
  (default `http://localhost:3000`)
- `VITE_API_BASE_URL` – forces Axios to use a specific base URL instead of
  the dev proxy (e.g. for production builds)

### Build for production

```bash
npm run build
npm start
```

`npm start` boots the bundled Express server (`server.js`) which serves the
built SPA from `dist/` and forwards `/api/*` to the backend identified by the
`BACKEND_URL` env var. Run it locally with:

```bash
BACKEND_URL=http://localhost:3000 PORT=4321 npm start
```

## Deploying to Railway

The frontend is designed to be deployed to Railway alongside the wallet
backend. The bundled `server.js` proxies `/api/*` to whatever URL is in
`BACKEND_URL`, so the browser only ever talks to the frontend service — no
CORS configuration is needed on the backend.

1. Create a new service in your Railway project from this repo.
2. Set environment variables on the frontend service:
   - `BACKEND_URL` – the backend's URL. If both services are in the same
     Railway project, use the private network for free traffic and lower
     latency:
     ```
     BACKEND_URL=http://${{wallet-api.RAILWAY_PRIVATE_DOMAIN}}:${{wallet-api.PORT}}
     ```
     (replace `wallet-api` with the actual backend service name). Otherwise
     point at the public domain (`https://wallet-api.up.railway.app`).
3. Railway's Nixpacks builder will run `npm install` → `npm run build` →
   `npm start` automatically (configured in `railway.json`). The server
   listens on `$PORT` provided by Railway.
4. Generate a public domain on the frontend service and open it in a browser.

## Project structure

```
src/
├── api/
│   ├── client.js          # Axios instance + interceptors
│   └── wallet.js          # Endpoint wrappers
├── components/
│   ├── Layout.jsx         # Sidebar shell
│   ├── ProtectedRoute.jsx # Auth guard
│   ├── StatCard.jsx       # KPI tile
│   └── charts/            # Chart.js bar charts
├── context/
│   └── AuthContext.jsx    # Token + username state
├── lib/
│   ├── credentials.js     # Local password hashing/storage
│   └── format.js          # Currency / signed-amount formatters
└── pages/
    ├── Dashboard.jsx
    ├── Login.jsx
    └── Transactions.jsx
```

## Notes on auth design

The backend assignment specifies token-based auth without passwords (`POST
/user` is the only "auth" endpoint). The dashboard requirement, however, calls
for username + password login. To reconcile the two, the dashboard:

1. Hashes the entered password with `crypto.subtle.digest('SHA-256')`.
2. Stores `{ passwordHash, token }` per username in a `localStorage` map.
3. On subsequent logins, verifies the password locally before reusing the
   stored token. New usernames trigger a backend registration.

The password never leaves the browser. If you need true server-side
credentials, extend the backend with a password field and a `/login` endpoint;
the frontend wrapper in `src/api/wallet.js` is the only place that would need
to change.
