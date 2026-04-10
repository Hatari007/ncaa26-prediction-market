import { useMemo, useState } from 'react';
import Header from './components/Header';
import AuthPanel from './components/AuthPanel';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminPage from './pages/AdminPage';
import { leaderboard, markets } from './data/mockData';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function getInitialPageFromHash() {
  const hash = window.location.hash.replace('#', '');
  return ['home', 'leaderboard', 'admin'].includes(hash) ? hash : 'home';
}

export default function App() {
  const [currentPage, setCurrentPage] = useState(getInitialPageFromHash());
  const [user, setUser] = useState(null);

  const hasSupabaseConfig = useMemo(
    () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
    []
  );

  const handleNavigate = (page) => {
    window.location.hash = page;
    setCurrentPage(page);
  };

  const handleSignIn = (email) => {
    // TODO: Replace with supabase.auth.signInWithOtp or preferred auth method.
    setUser({ id: 'demo-user', email });
  };

  const handleSignOut = () => setUser(null);

  return (
    <div className="app-shell">
      <Header currentPage={currentPage} onNavigate={handleNavigate} user={user} onSignOut={handleSignOut} />

      {!hasSupabaseConfig && (
        <div className="env-warning">
          Missing Supabase env vars. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
        </div>
      )}

      <main className="main-layout">
        <div className="content">
          {currentPage === 'home' && <HomePage markets={markets} />}
          {currentPage === 'leaderboard' && <LeaderboardPage leaderboard={leaderboard} />}
          {currentPage === 'admin' && <AdminPage markets={markets} user={user} />}
        </div>
        <aside>
          <AuthPanel user={user} onSignIn={handleSignIn} onSignOut={handleSignOut} />
        </aside>
      </main>
    </div>
  );
}
