import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/db';

export async function POST() {
  const token = cookies().get('kncs_session')?.value;
  if (token) await deleteSession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set('kncs_session', '', { path: '/', maxAge: 0 });
  return res;
}
