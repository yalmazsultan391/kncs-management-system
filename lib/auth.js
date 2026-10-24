import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getUserBySession } from './db';

// Passwords are NEVER stored in plain text. Format: scrypt:<salt hex>:<hash hex>
// (Node built-in scrypt — no native bcrypt build step needed on Vercel.)
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  try {
    const [, salt, hash] = stored.split(':');
    const check = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
  } catch {
    return false;
  }
}

export function newSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function sessionCookie(token) {
  // httpOnly + SameSite=Lax; Secure in production (HTTPS on Vercel).
  return {
    name: 'kncs_session',
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

export async function currentUser() {
  const token = cookies().get('kncs_session')?.value;
  if (!token) return null;
  return getUserBySession(token);
}

export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function passwordError(password) {
  if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return 'Password must contain at least one letter and one number.';
  return null;
}
