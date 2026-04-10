import { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const [message, setMessage] = useState('');

  const user = useMemo(() => session?.user ?? null, [session]);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      const {
        data: { session: currentSession }
      } = await supabase.auth.getSession();

      if (mounted) {
        setSession(currentSession);
        if (currentSession?.user?.user_metadata?.display_name) {
          setDisplayName(currentSession.user.user_metadata.display_name);
        }
        setLoading(false);
      }
    }

    initializeAuth();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
      setSession(updatedSession);
      setMessage('');

      const profileName = updatedSession?.user?.user_metadata?.display_name || '';
      setDisplayName(profileName);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleMagicLinkSignIn = async (event) => {
    event.preventDefault();
    setMessage('');
    setSendingLink(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      setMessage(`Could not send magic link: ${error.message}`);
    } else {
      setMessage('Magic link sent! Check your email to finish sign in.');
    }

    setSendingLink(false);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setMessage('');
    setSavingProfile(true);

    const normalized = displayName.trim();

    if (!normalized) {
      setMessage('Please enter a display name before saving.');
      setSavingProfile(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: normalized
      }
    });

    if (error) {
      setMessage(`Could not update display name: ${error.message}`);
    } else {
      setMessage('Display name saved. You are ready for your private friend-group site.');
    }

    setSavingProfile(false);
  };

  const handleSignOut = async () => {
    setMessage('');
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(`Could not sign out: ${error.message}`);
    } else {
      setMessage('Signed out successfully.');
    }
  };

  if (loading) {
    return <main className="page"><p>Loading session…</p></main>;
  }

  return (
    <main className="page">
      <section className="card">
        <h1>NCAA26 Prediction Market</h1>
        <p className="muted">
          Placeholder app: this login and profile setup is intended for a private friend-group site,
          not a public social network.
        </p>

        {!user ? (
          <form onSubmit={handleMagicLinkSignIn} className="stack">
            <label htmlFor="email">Email for magic link sign in</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit" disabled={sendingLink}>
              {sendingLink ? 'Sending link…' : 'Send magic link'}
            </button>
          </form>
        ) : (
          <>
            <p>
              Signed in as <strong>{user.email}</strong>
            </p>

            <form onSubmit={handleProfileSave} className="stack">
              <label htmlFor="displayName">Display name</label>
              <input
                id="displayName"
                type="text"
                required
                placeholder="How friends should see you"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
              <button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving…' : 'Save display name'}
              </button>
            </form>

            <button type="button" className="ghost" onClick={handleSignOut}>
              Sign out
            </button>
          </>
        )}

        {message && <p className="message">{message}</p>}
      </section>
    </main>
  );
}

export default App;
