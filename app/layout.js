import './globals.css';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata = {
  title: 'KNCS — KFUEIT Nexus Career Society | Management System',
  description: 'KFUEIT Nexus Career Society (KNCS, EST. 2024) — CONNECT • GROW • CAREERS. Member, task, event, jobs, companies, docs, CV and LinkedIn management.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before first paint (theme only — never user data). */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('kncs-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();` }} />
      </head>
      <body>
        <header className="header">
          <div className="header-inner">
            <span className="logo-pill">
              {/* Official KNCS logo: black on white, so it sits on a white pill in both modes. */}
              <img src="/logo.png" alt="KNCS — KFUEIT Nexus Career Society logo" />
            </span>
            <div className="brand">
              <h1>KNCS — KFUEIT Nexus Career Society</h1>
              <p>EST. 2024 • CONNECT • GROW • CAREERS</p>
            </div>
            <div className="header-actions">
              <a className="btn" href="/">Home</a>
              <a className="btn" href="/dashboard">Dashboard</a>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="main">{children}</main>
        <footer className="footer">KFUEIT Nexus Career Society (KNCS) • EST. 2024 • CONNECT • GROW • CAREERS</footer>
      </body>
    </html>
  );
}
