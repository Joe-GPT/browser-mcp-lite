import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync, chmodSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const secretsPath = join(homedir(), '.browser-mcp-secrets.json');

/** Read token from ~/.browser-mcp-secrets.json, or null if missing/invalid. */
export function loadToken() {
  try {
    const secrets = JSON.parse(readFileSync(secretsPath, 'utf8'));
    return secrets.token && secrets.token.length >= 32 ? secrets.token : null;
  } catch {
    return null;
  }
}

/** Load token; generate if missing. Always enforces 600 permissions. Returns { token, isNew }. */
export function ensureToken() {
  const existing = loadToken();
  if (existing) {
    // Enforce permissions on every startup (file may have been loosened)
    try { chmodSync(secretsPath, 0o600); } catch { /* may not own file */ }
    return { token: existing, isNew: false };
  }

  const token = randomBytes(32).toString('hex');
  let secrets = {};
  try { secrets = JSON.parse(readFileSync(secretsPath, 'utf8')); } catch { /* fresh */ }
  secrets.token = token;

  writeFileSync(secretsPath, JSON.stringify(secrets, null, 2) + '\n', 'utf8');
  chmodSync(secretsPath, 0o600);

  return { token, isNew: true };
}
