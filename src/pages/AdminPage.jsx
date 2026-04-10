import { useMemo } from 'react';

export default function AdminPage({ markets, user }) {
  const grouped = useMemo(() => {
    return {
      open: markets.filter((m) => m.state === 'open'),
      locked: markets.filter((m) => m.state === 'locked'),
      resolved: markets.filter((m) => m.state === 'resolved')
    };
  }, [markets]);

  if (!user) {
    return (
      <section className="card">
        <h1>Admin</h1>
        <p>Sign in to access market controls.</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Admin</h1>
      <p className="page-intro">Create markets, lock picks, resolve outcomes. No funny business*.</p>
      <p className="footnote">*Some funny business allowed for content.</p>

      <div className="admin-grid">
        {Object.entries(grouped).map(([state, stateMarkets]) => (
          <article className="card" key={state}>
            <h2>{state.toUpperCase()}</h2>
            <ul>
              {stateMarkets.map((market) => (
                <li key={market.id}>
                  <strong>{market.title}</strong>
                  <div className="inline-actions">
                    <button>Lock</button>
                    <button>Resolve</button>
                  </div>
                </li>
              ))}
            </ul>
            <button className="full-width">+ New Market</button>
          </article>
        ))}
      </div>
    </section>
  );
}
