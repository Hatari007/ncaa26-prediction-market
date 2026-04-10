const links = [
  { id: 'home', label: 'Markets' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'admin', label: 'Admin' }
];

export default function Header({ currentPage, onNavigate, user, onSignOut }) {
  return (
    <header className="topbar">
      <div className="brand" onClick={() => onNavigate('home')} role="button" tabIndex={0}>
        <span className="brand-logo">🏈📈</span>
        <div>
          <p className="brand-title">NCAA 26 Dynasty Exchange</p>
          <p className="brand-subtitle">Totally serious. Definitely regulated.</p>
        </div>
      </div>

      <nav className="nav" aria-label="Primary">
        {links.map((link) => (
          <button
            key={link.id}
            className={currentPage === link.id ? 'nav-btn active' : 'nav-btn'}
            onClick={() => onNavigate(link.id)}
          >
            {link.label}
          </button>
        ))}
      </nav>

      <div className="user-chip">
        {user ? (
          <>
            <span>{user.email}</span>
            <button className="text-btn" onClick={onSignOut}>Sign out</button>
          </>
        ) : (
          <span>Guest mode</span>
        )}
      </div>
    </header>
  );
}
