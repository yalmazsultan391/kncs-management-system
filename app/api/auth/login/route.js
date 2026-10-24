import { NextResponse } from 'next/server';
import { createSession, findUserByEmail } from '@/lib/db';
import { newSessionToken, sessionCookie, verifyPassword } from '@/lib/auth';

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const user = await findUserByEmail(email);
  // Same generic message whether the email or password is wrong.
  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }
  const token = newSessionToken();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await createSession(user.id, token, expires.toISOString());
  const { password_hash: _h, ...safe } = user;
  const res = NextResponse.json({ user: safe });
  const c = sessionCookie(token);
  res.cookies.set(c.name, c.value, { httpOnly: c.httpOnly, sameSite: c.sameSite, secure: c.secure, path: c.path, maxAge: c.maxAge });
  return res;
}
