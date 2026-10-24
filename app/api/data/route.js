import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { createItem, deleteItem, listItems, updateItem } from '@/lib/db';
import { canAccessModule } from '@/lib/permissions';

// Item type -> module that owns it. Enforced server-side: a role can only
// create/edit/delete items in modules it can access. President: all.
const TYPE_MODULE = {
  member: 'hr', task: 'customer', issue: 'customer', event: 'customer',
  job: 'research', scholarship: 'research', competition: 'research', project: 'research',
  company: 'companies', doc: 'administration', cv: 'profiles', linkedin: 'profiles',
};
const ALLOWED_TYPES = Object.keys(TYPE_MODULE);
const ALLOWED_STATUSES = ['Open', 'In Progress', 'Planned', 'Active', 'Pending', 'Done', 'Closed', 'Reviewed'];

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  const items = await listItems();
  // Non-President users see only items in their modules (plus their own).
  if (user.role === 'President') return NextResponse.json({ items });
  const visible = items.filter((it) => {
    const mod = TYPE_MODULE[it.type] || 'admin';
    return canAccessModule(user.role, mod) || it.owner_email === user.email;
  });
  return NextResponse.json({ items: visible });
}

export async function POST(req) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  const type = String(body.type || '');
  const title = String(body.title || '').trim();
  if (!ALLOWED_TYPES.includes(type)) return NextResponse.json({ error: 'Invalid item type.' }, { status: 400 });
  if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  // Admin module items (e.g. member addition is via HR; terms are static) —
  // members are created through HR, so enforce HR access for members.
  const mod = TYPE_MODULE[type];
  if (user.role !== 'President' && !canAccessModule(user.role, mod)) {
    return NextResponse.json({ error: 'Your role does not have access to this module.' }, { status: 403 });
  }
  const status = ALLOWED_STATUSES.includes(body.status) ? body.status : 'Open';
  const item = await createItem({ type, title, detail: String(body.detail || ''), status, owner_email: user.email, meta: body.meta || {} });
  return NextResponse.json({ item }, { status: 201 });
}

export async function PUT(req) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  const items = await listItems();
  const row = items.find((x) => String(x.id) === String(body.id));
  if (!row) return NextResponse.json({ error: 'Item not found.' }, { status: 404 });
  const mod = TYPE_MODULE[row.type] || 'admin';
  if (user.role !== 'President' && !canAccessModule(user.role, mod)) {
    return NextResponse.json({ error: 'Your role does not have access to this module.' }, { status: 403 });
  }
  const updated = await updateItem(body.id, { title: body.title, detail: body.detail, status: body.status });
  return NextResponse.json({ item: updated });
}

export async function DELETE(req) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const items = await listItems();
  const row = items.find((x) => String(x.id) === String(id));
  if (!row) return NextResponse.json({ error: 'Item not found.' }, { status: 404 });
  const mod = TYPE_MODULE[row.type] || 'admin';
  if (user.role !== 'President' && !canAccessModule(user.role, mod)) {
    return NextResponse.json({ error: 'Your role does not have access to this module.' }, { status: 403 });
  }
  await deleteItem(id);
  return NextResponse.json({ ok: true });
}
