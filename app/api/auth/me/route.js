import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { dbMode } from '@/lib/db';

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user, dbMode: await dbMode() });
}
