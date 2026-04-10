import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function AuthGate({ children }) {
  const [session, setSession] = useState(undefined);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session ?? null);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const sendMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Keep this easy to change if deployment URL changes.
        emailRedirectTo: window.location.origin,
      },
    });

    if (signInError) {
      setError(signInError.message);
    }

    setLoading(false);
  };

  if (session === undefined) {
    return <div className="center-card">Loading auth...</div>;
  }

  if (!session) {
    return (
      <div className="auth-shell">
        <div className="center-card">
          <h1>🏟️ Totally Legit Sportsbook</h1>
          <p>Parody picks. Zero cash. Infinite bragging rights.</p>
          <form onSubmit={sendMagicLink} className="form-stack">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button disabled={loading}>{loading ? 'Sending...' : 'Send Magic Link'}</button>
          </form>
        </div>
      </div>
    );
  }

  return children(session.user);
}
