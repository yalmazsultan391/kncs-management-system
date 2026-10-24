import AuthForm from '@/components/AuthForm';
import { MODULES } from '@/lib/permissions';

export default function Home() {
  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>KFUEIT Nexus Career Society — Management System</h2>
        <p>Manage members, roles, tasks, events, scholarships, jobs, companies, documents, CV reviews and LinkedIn growth — in one place, with dark and light mode.</p>
        <p className="small">EST. 2024 • CONNECT • GROW • CAREERS</p>
      </div>
      <div className="grid">
        {MODULES.map((m) => (
          <div className="card" key={m.key}>
            <h3 style={{ marginTop: 0 }}>{m.name}</h3>
            <p className="small">{m.desc}</p>
          </div>
        ))}
      </div>
      <AuthForm />
      <p className="small">Demo data in the dashboard is clearly labelled [DEMO] and is not real society data. Replace demo entries with real members, events and companies once the society team starts using the system.</p>
    </>
  );
}
