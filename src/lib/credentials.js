// Local credentials store for the admin dashboard.
//
// The wallet backend uses token-based auth (POST /user returns a JWT);
// it does not validate passwords. To match the assignment requirement
// of "login with username and password", we store a per-browser
// credentials map: { username: { passwordHash, token } } in localStorage.
//
// First time a username is entered we register it against the backend
// and remember the password hash locally. On subsequent logins we
// verify the password locally before reusing the saved token.

const STORE_KEY = 'wallet-dashboard:credentials';

async function sha256(input) {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeStore(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

export async function findCredential(username, password) {
  const store = readStore();
  const entry = store[username];
  if (!entry) return null;
  const hash = await sha256(password);
  return entry.passwordHash === hash ? entry : null;
}

export async function saveCredential(username, password, token) {
  const store = readStore();
  store[username] = {
    passwordHash: await sha256(password),
    token,
  };
  writeStore(store);
}

export function hasUsername(username) {
  return Boolean(readStore()[username]);
}
