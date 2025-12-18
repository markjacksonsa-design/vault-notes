interface NavbarProps {
  view: 'student' | 'seller' | 'library';
  setView: (view: 'student' | 'seller' | 'library') => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  activeTheme: {
    card: string;
    text: string;
    border: string;
  };
}

export default function Navbar({ view, setView, theme, toggleTheme, activeTheme }: NavbarProps) {
  const navItems = [
    { id: 'student', label: 'Shop', color: '#3b82f6' },
    { id: 'library', label: 'My Vault', color: '#a855f7' },
    { id: 'seller', label: 'Seller', color: '#10b981' },
  ] as const;

  return (
    <nav style={{
      maxWidth: '1100px',
      margin: '0 auto 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: activeTheme.card,
      padding: '12px 25px',
      borderRadius: '50px',
      border: `1px solid ${activeTheme.border}`,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className="nav-btn"
            style={{
              padding: '10px 24px',
              borderRadius: '50px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease',
              backgroundColor: view === item.id ? item.color : 'transparent',
              color: view === item.id ? 'white' : activeTheme.text,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <button
        onClick={toggleTheme}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.5rem',
          padding: '8px',
          borderRadius: '50%',
          transition: 'transform 0.3s ease',
        }}
        className="theme-toggle"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <style jsx>{`
        .nav-btn:hover {
          transform: translateY(-2px);
        }
        .theme-toggle:hover {
          transform: scale(1.1) rotate(15deg);
        }
      `}</style>
    </nav>
  );
}

