// Data layer: Postgres when DATABASE_URL is set (Vercel Postgres / Neon /
// Supabase in production), otherwise a server-side in-memory store so the
// app still runs locally for development. The in-memory store is NOT a
// production database: it resets when the serverless function restarts.
// Browser localStorage is never used as the database.
//
// Postgres schema (created automatically on first use):
//   users(id, name, email UNIQUE, password_hash, role, created_at)
//   sessions(token PK, user_id, expires_at)
//   items(id, type, title, detail, status, owner_email, meta JSONB, created_at)
//
// Item types: member, task, issue, event, job, scholarship, company,
// doc, cv, linkedin, competition, project.

let pool = null;
let poolTried = false;

function getPool() {
  if (poolTried) return pool;
  poolTried = true;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    // eslint-disable-next-line global-require
    const { Pool } = require('pg');
    pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  } catch (e) {
    console.error('pg not available, falling back to memory store', e);
    pool = null;
  }
  return pool;
}

let schemaReady = false;
async function ensureSchema() {
  const p = getPool();
  if (!p || schemaReady) return;
  await p.query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, role TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  await p.query(`CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
  )`);
  await p.query(`CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL,
    detail TEXT DEFAULT '', status TEXT DEFAULT 'Open', owner_email TEXT DEFAULT '',
    meta JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  schemaReady = true;
}

// ---- In-memory fallback (local dev only) ----
const mem = {
  users: [],
  sessions: new Map(),
  items: [],
  nextUserId: 1,
  nextItemId: 1,
  seeded: false,
};

function demoItems() {
  const d = (type, title, detail, status) => ({
    type, title, detail, status: status || 'Open', owner_email: '', meta: {},
  });
  return [
    d('member', '[DEMO] Demo Member 1', 'Sample roster entry only — not a real person. Role: CV/Resume Reviewer.', 'Active'),
    d('member', '[DEMO] Demo Member 2', 'Sample roster entry only — not a real person. Role: Event Manager.', 'Active'),
    d('member', '[DEMO] Demo Member 3', 'Sample roster entry only — not a real person. Role: LinkedIn Mentor.', 'Pending'),
    d('task', '[DEMO] Prepare welcome session checklist', 'Sample task for the Customer Relationship module.', 'In Progress'),
    d('issue', '[DEMO] Member portal question', 'Sample customer issue — replace with a real issue when live.', 'Open'),
    d('event', '[DEMO] Career Guidance Workshop', 'Sample event. Replace date/venue with real details before publishing.', 'Planned'),
    d('job', '[DEMO] Junior Developer Internship', 'Sample jobs-board entry. Add the real employer link when live.', 'Open'),
    d('scholarship', '[DEMO] Merit Scholarship — Research', 'Sample scholarship entry. Verify eligibility on the official source before sharing.', 'Open'),
    d('company', '[DEMO] Sample Partner Company', 'Sample company contact. Success rate is a demo figure until real data is entered.', 'Active'),
    d('doc', '[DEMO] Society Constitution (sample)', 'Sample document entry — upload/link the real document when available.', 'Active'),
    d('cv', '[DEMO] CV Review Queue — Batch 1', 'Sample CV status: 5 CVs received, 2 reviewed (demo figures).', 'In Progress'),
    d('linkedin', '[DEMO] LinkedIn Growth — This Month', 'Sample tracker: followers +120 (demo figure). Enter real analytics when live.', 'Active'),
    d('competition', '[DEMO] International Case Competition', 'Sample international competition entry for Research.', 'Open'),
    d('project', '[DEMO] Research Lead: Career Skills Survey', 'Sample projects-research-lead entry.', 'In Progress'),
  ];
}

function seedMemory() {
  if (mem.seeded) return;
  mem.seeded = true;
  for (const it of demoItems()) mem.items.push({ id: mem.nextItemId++, ...it, created_at: new Date().toISOString() });
}

export async function dbMode() {
  return getPool() ? 'postgres' : 'memory (local dev only)';
}

export async function listItems() {
  const p = getPool();
  if (p) {
    await ensureSchema();
    const r = await p.query('SELECT * FROM items ORDER BY id ASC');
    if (r.rows.length === 0) {
      for (const it of demoItems()) {
        await p.query('INSERT INTO items(type,title,detail,status,owner_email,meta) VALUES($1,$2,$3,$4,$5,$6)',
          [it.type, it.title, it.detail, it.status, it.owner_email, it.meta]);
      }
      const r2 = await p.query('SELECT * FROM items ORDER BY id ASC');
      return r2.rows;
    }
    return r.rows;
  }
  seedMemory();
  return mem.items;
}

export async function createItem(item) {
  const p = getPool();
  if (p) {
    await ensureSchema();
    const r = await p.query(
      'INSERT INTO items(type,title,detail,status,owner_email,meta) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
      [item.type, item.title, item.detail || '', item.status || 'Open', item.owner_email || '', item.meta || {}]);
    return r.rows[0];
  }
  seedMemory();
  const row = { id: mem.nextItemId++, ...item, detail: item.detail || '', status: item.status || 'Open', created_at: new Date().toISOString() };
  mem.items.push(row);
  return row;
}

export async function updateItem(id, patch) {
  const p = getPool();
  if (p) {
    await ensureSchema();
    const r = await p.query(
      'UPDATE items SET title=COALESCE($2,title), detail=COALESCE($3,detail), status=COALESCE($4,status) WHERE id=$1 RETURNING *',
      [Number(id), patch.title ?? null, patch.detail ?? null, patch.status ?? null]);
    return r.rows[0] || null;
  }
  const row = mem.items.find((x) => x.id === Number(id));
  if (!row) return null;
  Object.assign(row, patch);
  return row;
}

export async function deleteItem(id) {
  const p = getPool();
  if (p) {
    await ensureSchema();
    await p.query('DELETE FROM items WHERE id=$1', [Number(id)]);
    return true;
  }
  mem.items = mem.items.filter((x) => x.id !== Number(id));
  return true;
}

export async function findUserByEmail(email) {
  const p = getPool();
  if (p) {
    await ensureSchema();
    const r = await p.query('SELECT * FROM users WHERE LOWER(email)=LOWER($1)', [email]);
    return r.rows[0] || null;
  }
  return mem.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function createUser({ name, email, password_hash, role }) {
  const p = getPool();
  if (p) {
    await ensureSchema();
    const r = await p.query(
      'INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role,created_at',
      [name, email, password_hash, role]);
    return r.rows[0];
  }
  const user = { id: mem.nextUserId++, name, email, password_hash, role, created_at: new Date().toISOString() };
  mem.users.push(user);
  const { password_hash: _h, ...safe } = user;
  return safe;
}

export async function createSession(userId, token, expiresAt) {
  const p = getPool();
  if (p) {
    await ensureSchema();
    await p.query('INSERT INTO sessions(token,user_id,expires_at) VALUES($1,$2,$3)', [token, userId, expiresAt]);
    return;
  }
  mem.sessions.set(token, { user_id: userId, expires_at: expiresAt });
}

export async function getUserBySession(token) {
  const p = getPool();
  if (p) {
    await ensureSchema();
    const r = await p.query(
      `SELECT u.id,u.name,u.email,u.role,u.created_at FROM users u
       JOIN sessions s ON s.user_id=u.id WHERE s.token=$1 AND s.expires_at > NOW()`, [token]);
    return r.rows[0] || null;
  }
  const s = mem.sessions.get(token);
  if (!s || new Date(s.expires_at) < new Date()) return null;
  const u = mem.users.find((x) => x.id === s.user_id);
  if (!u) return null;
  const { password_hash: _h, ...safe } = u;
  return safe;
}

export async function deleteSession(token) {
  const p = getPool();
  if (p) {
    await ensureSchema();
    await p.query('DELETE FROM sessions WHERE token=$1', [token]);
    return;
  }
  mem.sessions.delete(token);
}
