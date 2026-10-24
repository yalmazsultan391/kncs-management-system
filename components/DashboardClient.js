'use client';
import { useEffect, useMemo, useState } from 'react';
import { MODULES, visibleModules } from '@/lib/permissions';

const TYPE_LABEL = {
  member: 'Member', task: 'Task', issue: 'Customer issue', event: 'Event',
  job: 'Job', scholarship: 'Scholarship', company: 'Company', doc: 'Document',
  cv: 'CV status', linkedin: 'LinkedIn tracker', competition: 'International competition', project: 'Research project',
};
const MODULE_TYPES = {
  admin: [],
  hr: ['member'],
  customer: ['issue', 'task', 'event'],
  research: ['job', 'scholarship', 'competition', 'project'],
  administration: ['doc'],
  companies: ['company', 'event'],
  profiles: ['cv', 'linkedin'],
  settings: [],
};
const STATUSES = ['Open', 'In Progress', 'Planned', 'Active', 'Pending', 'Done', 'Closed', 'Reviewed'];

function ItemList({ items, types, onRefresh }) {
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [type, setType] = useState(types[0] || 'task');
  const [status, setStatus] = useState('Open');
  const [msg, setMsg] = useState('');
  const shown = items.filter((it) => types.includes(it.type));
  async function add(e) {
    e.preventDefault(); setMsg('');
    const res = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, title, detail, status }) });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error || 'Could not add item.'); return; }
    setTitle(''); setDetail(''); setMsg('Added.'); onRefresh();
  }
  async function updateStatus(it, newStatus) {
    await fetch('/api/data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: it.id, status: newStatus }) });
    onRefresh();
  }
  async function remove(it) {
    if (!confirm(`Delete "${it.title}"?`)) return;
    await fetch(`/api/data?id=${it.id}`, { method: 'DELETE' });
    onRefresh();
  }
  if (!types.length) return null;
  return (
    <div>
      <form onSubmit={add} className="card">
        <h4 style={{ marginTop: 0 }}>Add new entry</h4>
        <label>Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {types.map((t) => <option key={t} value={t}>{TYPE_LABEL[t] || t}</option>)}
        </select>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        <label>Details</label>
        <textarea value={detail} onChange={(e) => setDetail(e.target.value)} />
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn btn-primary" type="submit" style={{ marginTop: 12 }}>Add entry</button>
        {msg && <p className="small">{msg}</p>}
      </form>
      {shown.length === 0 && <p className="small">No entries yet in this module.</p>}
      {shown.map((it) => (
        <div className="item" key={it.id}>
          <h4>{it.title}</h4>
          <p><span className="pill">{TYPE_LABEL[it.type] || it.type}</span><span className="pill">{it.status}</span></p>
          {it.detail && <p>{it.detail}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <select value={it.status} onChange={(e) => updateStatus(it, e.target.value)} style={{ width: 'auto' }}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button className="btn btn-danger" onClick={() => remove(it)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardClient() {
  const [user, setUser] = useState(null);
  const [dbMode, setDbMode] = useState('');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');

  async function load() {
    const meRes = await fetch('/api/auth/me');
    if (!meRes.ok) { window.location.href = '/'; return; }
    const me = await meRes.json();
    setUser(me.user); setDbMode(me.dbMode || '');
    const dataRes = await fetch('/api/data');
    const data = await dataRes.json();
    setItems(data.items || []);
  }
  useEffect(() => { load(); }, []);
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }
  const mods = useMemo(() => (user ? visibleModules(user.role) : []), [user]);
  const stats = useMemo(() => {
    const by = (t) => items.filter((i) => i.type === t);
    const companies = by('company');
    const done = items.filter((i) => i.status === 'Done' || i.status === 'Reviewed').length;
    const success = companies.length ? Math.round((companies.filter((c) => c.status === 'Active').length / companies.length) * 100) : 0;
    return { members: by('member').length, tasks: by('task').length, events: by('event').length, jobs: by('job').length, scholarships: by('scholarship').length, companies: companies.length, docs: by('doc').length, done, total: items.length, success };
  }, [items]);

  if (error) return <div className="error">{error}</div>;
  if (!user) return <p>Loading dashboard…</p>;

  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Welcome, {user.name}</h2>
        <p className="small">Role: <b>{user.role}</b> • Email: {user.email} • {user.role === 'President' ? 'All-access (Admin)' : 'You see only your module(s) plus your own profile.'}</p>
        <p className="small">Database: {dbMode}. {dbMode && dbMode.startsWith('memory') ? 'Set DATABASE_URL in production for shared, persistent data.' : ''}</p>
        <button className="btn" onClick={logout}>Log out</button>
        <button className="btn" onClick={load} style={{ marginLeft: 8 }}>Refresh</button>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
        {mods.map((m) => <button key={m.key} className={`tab ${tab === m.key ? 'active' : ''}`} onClick={() => setTab(m.key)}>{m.name}</button>)}
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid">
            <div className="card stat"><b>{stats.members}</b><span>Members (roster)</span></div>
            <div className="card stat"><b>{stats.tasks}</b><span>Tasks</span></div>
            <div className="card stat"><b>{stats.events}</b><span>Events</span></div>
            <div className="card stat"><b>{stats.jobs}</b><span>Jobs board entries</span></div>
            <div className="card stat"><b>{stats.scholarships}</b><span>Scholarships</span></div>
            <div className="card stat"><b>{stats.companies}</b><span>Companies</span></div>
            <div className="card stat"><b>{stats.docs}</b><span>Documents</span></div>
            <div className="card stat"><b>{stats.success}%</b><span>Companies success rate (Active companies ÷ all companies)</span></div>
            <div className="card stat"><b>{stats.done} / {stats.total}</b><span>Items Done / Reviewed</span></div>
          </div>
          <div className="card">
            <h3>Performance summary</h3>
            <p className="small">These summaries are computed live from the entries in the system — they are not fixed numbers. Add real tasks, events and companies and the figures update automatically. Entries labelled [DEMO] are sample data only, not real members or partners.</p>
          </div>
        </>
      )}

      {tab === 'admin' && (
        <div className="card">
          <h3>Admin — Performance & analysis</h3>
          <p className="small">Members: {stats.members} • Tasks: {stats.tasks} • Events: {stats.events} • Jobs: {stats.jobs} • Scholarships: {stats.scholarships} • Companies: {stats.companies} • Documents: {stats.docs} • Success rate: {stats.success}%</p>
          <h4>Terms & policies</h4>
          <p className="small">1. Society data is for KNCS members only. 2. Do not share member contact details outside the society. 3. Scholarships and jobs must be verified on the official source before sharing. 4. The President has all access; other roles see only their own module. (Replace this placeholder text with the society&apos;s approved terms when they are finalised.)</p>
          <p className="small">Member addition is managed in HR; as an admin you can view and manage every module via its tab.</p>
        </div>
      )}

      {tab === 'hr' && (
        <div>
          <div className="card"><h3 style={{ marginTop: 0 }}>HR — Membership control & role recruitment</h3><p className="small">Add a member, set their status (Active / Pending), and note their role in the details. Use the status dropdown on each entry to approve or hold a membership.</p></div>
          <ItemList items={items} types={MODULE_TYPES.hr} onRefresh={load} />
        </div>
      )}

      {tab === 'customer' && (
        <div>
          <div className="card"><h3 style={{ marginTop: 0 }}>Customer Relationship — Issues, tasks & events</h3></div>
          <ItemList items={items} types={MODULE_TYPES.customer} onRefresh={load} />
        </div>
      )}

      {tab === 'research' && (
        <div>
          <div className="card"><h3 style={{ marginTop: 0 }}>Research — Scholarships, jobs, competitions & projects</h3><p className="small">Add a scholarship, job, international competition or research project. For companies contact, see Companies Connectivity.</p></div>
          <ItemList items={items} types={MODULE_TYPES.research} onRefresh={load} />
        </div>
      )}

      {tab === 'administration' && (
        <div>
          <div className="card"><h3 style={{ marginTop: 0 }}>Administration Management — Accountant & docs</h3><p className="small">Accountant summary (live): {stats.docs} documents, {stats.tasks} tasks, {stats.done} items done/reviewed. Record finance notes as documents with the amount and purpose in the details field until a dedicated ledger is added.</p></div>
          <ItemList items={items} types={MODULE_TYPES.administration} onRefresh={load} />
        </div>
      )}

      {tab === 'companies' && (
        <div>
          <div className="card"><h3 style={{ marginTop: 0 }}>Companies Connectivity — Events & success rate</h3><p className="small">Success rate now: {stats.success}% (Active companies ÷ all companies). Add a company, mark it Active when the partnership is live, and add its events here.</p></div>
          <ItemList items={items} types={MODULE_TYPES.companies} onRefresh={load} />
        </div>
      )}

      {tab === 'profiles' && (
        <div>
          <div className="card"><h3 style={{ marginTop: 0 }}>Students&apos; Profile Management — CV & LinkedIn</h3><p className="small">Track CV/resume review status and LinkedIn growth per student batch. Use the details field for counts, links or reviewer notes.</p></div>
          <ItemList items={items} types={MODULE_TYPES.profiles} onRefresh={load} />
        </div>
      )}

      {tab === 'settings' && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Settings</h3>
          <p><b>Name:</b> {user.name}</p>
          <p><b>Email:</b> {user.email}</p>
          <p><b>Role:</b> {user.role}</p>
          <p className="small">Theme (dark / light) is switched from the header and saved in your browser — theme choice is personal, it is not society data. To change your password, log out and register a new account only if your role allows it, or ask the President to reset it in the database (password-reset flow is a planned next step — see README).</p>
          <button className="btn" onClick={logout}>Log out</button>
        </div>
      )}
    </>
  );
}
