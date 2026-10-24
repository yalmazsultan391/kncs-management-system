'use client';
import { useState } from 'react';
import { ROLES } from '@/lib/permissions';

export default function AuthForm() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Human Resource');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' ? { email, password } : { name, email, password, role };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      window.location.href = '/dashboard';
    } catch {
      setError('Network error. Please try again.');
    } finally { setBusy(false); }
  }

  return (
    <div className="card">
      <div className="tabs">
        <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Log in</button>
        <button className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Register</button>
      </div>
      <h2 style={{ marginTop: 0 }}>{mode === 'login' ? 'Log in to KNCS' : 'Register for KNCS'}</h2>
      <p className="small">Passwords are hashed on the server and never stored in plain text. Choose your society role when registering — the President role sees all modules; other roles see only their own module plus their own profile.</p>
      {error && <div className="error">{error}</div>}
      <form onSubmit={submit}>
        {mode === 'register' && (
          <>
            <label>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Ayesha Khan" />
            <label>Society role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </>
        )}
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
        <label>Password {mode === 'register' && <span className="small">(min. 8 characters, at least one letter and one number)</span>}</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn btn-gold" type="submit" disabled={busy} style={{ marginTop: 14 }}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
