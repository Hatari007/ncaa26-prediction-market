import { useState } from 'react';

export default function AuthPanel({ user, onSignIn, onSignOut }) {
  const [email, setEmail] = useState('');

  if (user) {
    return (
      <section className="card auth-card">
        <h2>Account</h2>
        <p>Signed in as <strong>{user.email}</strong>.</p>
        <button onClick={onSignOut}>Sign out</button>
      </section>
    );
  }

  return (
    <section className="card auth-card">
      <h2>Sign in</h2>
      <p>Mock auth UI now; wire this to Supabase Auth later.</p>
      <label htmlFor="email-input">Email</label>
      <input
        id="email-input"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="coach@dynasty.gg"
      />
      <button onClick={() => onSignIn(email)} disabled={!email}>Sign in</button>
    </section>
  );
}
