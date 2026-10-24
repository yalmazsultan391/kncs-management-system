import { NextResponse } from 'next/server';
import { createUser, createSession, findUserByEmail } from '@/lib/db';
import { hashPassword, isValidEmail, newSessionToken, passwordError, sessionCookie } from '@/lib/auth';
import { ROLES } from '@/lib/permissions';

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const role = String(body.role || '');
  if (!name) return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
  if (!isValidEmail(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  const pwErr = passwordError(password);
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });
  if (!ROLES.includes(role)) return NextResponse.json({ error: 'Choose a valid society role.' }, { status: 400 });
  if (await findUserByEmail(email)) return NextResponse.json({ error: 'An account with this email already exists. Please log in.' }, { status: 409 });

  const user = await createUser({ name, email, password_hash: hashPassword(password), role });
  const token = newSessionToken();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await createSession(user.id, token, expires.toISOString());
  const res = NextResponse.json({ user });
  const c = sessionCookie(token);
  res.cookies.set(c.name, c.value, { httpOnly: c.httpOnly, sameSite: c.sameSite, secure: c.secure, path: c.path, maxAge: c.maxAge });
  return res;
}
