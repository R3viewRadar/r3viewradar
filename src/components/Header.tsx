import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="R3viewRadar logo">
            <circle cx="16" cy="16" r="14" stroke="var(--teal)" strokeWidth="2" fill="none" />
            <circle cx="16" cy="16" r="9" stroke="var(--teal)" strokeWidth="1.5" fill="none" opacity="0.6" />
            <circle cx="16" cy="16" r="4" stroke="var(--teal)" strokeWidth="1.5" fill="none" opacity="0.3" />
            <line x1="16" y1="16" x2="26" y2="8" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="16" r="2" fill="var(--teal)" />
          </svg>
          <span className="logo-text">R3viewRadar</span>
        </Link>
        <nav className="nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Search
          </Link>
          <Link to="/how-it-works" className={`nav-link ${location.pathname === '/how-it-works' ? 'active' : ''}`}>
            How It Works
          </Link>
        </nav>
      </div>
    </header>
  );
}
