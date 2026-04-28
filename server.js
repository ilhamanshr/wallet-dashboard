// Production server for the wallet dashboard.
//
// Serves the built Vite SPA from `dist/` and forwards `/api/*` requests
// to the wallet backend via BACKEND_URL. This keeps the browser on a
// single origin (no CORS) and lets us point at Railway's private
// network (e.g. http://wallet-api.railway.internal:3000) when both
// services are deployed in the same Railway project.

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dns from 'node:dns';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Railway's private network (*.railway.internal) is IPv6-only.
// Node 18 defaults to 'ipv4first', which breaks resolution for IPv6-only
// hostnames. 'verbatim' returns DNS records in the order the resolver
// provides them — the AAAA record is returned first (and is the only
// record) on Railway internal DNS. ('ipv6first' is Node 20+ only.)
dns.setDefaultResultOrder('verbatim');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const port = Number(process.env.PORT) || 3000;
const backendUrl = process.env.BACKEND_URL;

if (!backendUrl) {
  console.warn(
    '[server] BACKEND_URL is not set; /api/* requests will 502. ' +
      'Set it to the wallet backend (e.g. http://wallet-api.railway.internal:3000).',
  );
}

const app = express();

app.disable('x-powered-by');

// API proxy: /api/balance → ${BACKEND_URL}/balance
app.use(
  '/api',
  createProxyMiddleware({
    target: backendUrl || 'http://localhost:3000',
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    on: {
      error(err, req, res) {
        console.error(
          `[proxy] ${req.method} ${req.url} -> ${backendUrl} failed:`,
          err.code || '',
          err.message,
        );
        if (res && !res.headersSent && typeof res.status === 'function') {
          res.status(502).json({
            error: 'Bad gateway',
            code: err.code,
            message: err.message,
          });
        }
      },
    },
  }),
);

// Static SPA assets
const distDir = path.join(__dirname, 'dist');
app.use(
  express.static(distDir, {
    index: false,
    maxAge: '1h',
  }),
);

// SPA fallback — every other route returns index.html
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(
    `[server] wallet-dashboard listening on :${port} ` +
      `(proxy /api → ${backendUrl || '(unset)'})`,
  );
});
