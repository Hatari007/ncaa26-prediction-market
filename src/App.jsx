import { useMemo, useState } from 'react';

const STORAGE_KEY = 'wotwtc-state-v1';
const SESSION_KEY = 'wotwtc-player-id';

const playersSeed = [
  { id: 'frank', displayName: 'Frank', dynastyTeam: 'Tennessee', role: 'admin', logo: 'T' },
  { id: 'jeff', displayName: 'Jeff', dynastyTeam: 'Texas', role: 'user', logo: 'TX' },
  { id: 'aus', displayName: 'Aus', dynastyTeam: 'Iowa', role: 'user', logo: 'IA' },
  { id: 'matt', displayName: 'Matt', dynastyTeam: 'TCU', role: 'user', logo: 'TCU' },
  { id: 'bryan', displayName: 'Bryan', dynastyTeam: 'Georgia Tech', role: 'user', logo: 'GT' },
  { id: 'tom', displayName: 'Tom', dynastyTeam: 'Stanford', role: 'user', logo: 'S' },
  { id: 'eric', displayName: 'Eric', dynastyTeam: 'Rice', role: 'user', logo: 'R' },
  { id: 'mired', displayName: 'Mired', dynastyTeam: 'USC', role: 'user', logo: 'SC' },
];

const marketsSeed = [
  {
    id: 'tcu-iowa',
    title: 'Who will win TCU vs. Iowa?',
    description: 'Semifinal pick. Locks at kickoff by commissioner button, not by a clock.',
    status: 'open',
    lockLabel: 'Kickoff',
    pointValue: 1,
    options: [
      { id: 'tcu', label: 'TCU' },
      { id: 'iowa', label: 'Iowa' },
    ],
    resolvedOptionId: null,
  },
  {
    id: 'tennessee-texas',
    title: 'Who will win Tennessee vs. Texas?',
    description: 'Semifinal pick. Locks at kickoff by commissioner button, not by a clock.',
    status: 'open',
    lockLabel: 'Kickoff',
    pointValue: 1,
    options: [
      { id: 'tennessee', label: 'Tennessee' },
      { id: 'texas', label: 'Texas' },
    ],
    resolvedOptionId: null,
  },
  {
    id: 'national-championship',
    title: 'Who will win the National Championship?',
    description: 'Pick the champion from the remaining field. Double points, double pressure.',
    status: 'open',
    lockLabel: 'Kickoff',
    pointValue: 2,
    options: [
      { id: 'texas', label: 'Texas' },
      { id: 'iowa', label: 'Iowa' },
      { id: 'tennessee', label: 'Tennessee' },
      { id: 'tcu', label: 'TCU' },
    ],
    resolvedOptionId: null,
  },
];

function buildInitialState() {
  return { players: playersSeed, markets: marketsSeed, picks: [] };
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : buildInitialState();
  } catch {
    return buildInitialState();
  }
}

function saveState(nextState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function calculateLeaderboard(players, markets, picks) {
  return players
    .map((player) => {
      const playerPicks = picks.filter((pick) => pick.playerId === player.id);
      let points = 0;
      let correct = 0;
      let resolvedPicks = 0;

      for (const pick of playerPicks) {
        const market = markets.find((item) => item.id === pick.marketId);
        if (!market || market.status !== 'resolved') continue;
        resolvedPicks += 1;
        if (pick.optionId === market.resolvedOptionId) {
          correct += 1;
          points += Number(market.pointValue || 1);
        }
      }

      return {
        ...player,
        points,
        correct,
        resolvedPicks,
        accuracy: resolvedPicks ? Math.round((correct / resolvedPicks) * 100) : 0,
      };
    })
    .sort((a, b) => b.points - a.points || b.correct - a.correct || a.displayName.localeCompare(b.displayName));
}

function getPickCounts(market, picks) {
  const counts = new Map(market.options.map((option) => [option.id, 0]));
  for (const pick of picks.filter((item) => item.marketId === market.id)) {
    counts.set(pick.optionId, (counts.get(pick.optionId) || 0) + 1);
  }
  return counts;
}

function TeamBadge({ player }) {
  return (
    <span className="team-badge" title={`${player.dynastyTeam} dynasty logo placeholder`}>
      {player.logo}
    </span>
  );
}

function LoginScreen({ players, onLogin }) {
  const [selected, setSelected] = useState(players[0]?.id || '');

function Leaderboard({ rows }) {
  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">NCAA 26 Dynasty Market</p>
        <h1>Waiting on the World to Change</h1>
        <p className="hero-copy">Fake odds, real bragging rights. No money, no payouts, no bookie — just your friends being confidently wrong.</p>
        <label>
          Choose your display name
          <select value={selected} onChange={(event) => setSelected(event.target.value)}>
            {players.map((player) => (
              <option key={player.id} value={player.id}>{player.displayName} · {player.dynastyTeam}</option>
            ))}
          </select>
        </label>
        <button className="primary-btn" onClick={() => onLogin(selected)}>Enter the book</button>
        <p className="fine-print">Entertainment only. Display-name login is intentionally casual for this private group.</p>
      </section>
    </main>
  );
}

function MarketCard({ market, picks, currentPlayer, onPick }) {
  const userPick = picks.find((pick) => pick.marketId === market.id && pick.playerId === currentPlayer.id);
  const counts = getPickCounts(market, picks);
  const totalPicks = [...counts.values()].reduce((sum, value) => sum + value, 0);
  const showPublicPicks = market.status !== 'open';

  return (
    <article className={`market-card market-${market.status}`}>
      <div className="market-topline">
        <span className="status-pill">{market.status}</span>
        <span>{market.pointValue} pt{market.pointValue === 1 ? '' : 's'}</span>
      </div>
      <h3>{market.title}</h3>
      <p>{market.description}</p>
      <div className="market-meta">
        <span>🔒 Locks: {market.lockLabel}</span>
        <span>🎟️ Picks: {totalPicks}</span>
      </div>
      <div className="option-stack">
        {market.options.map((option) => {
          const count = counts.get(option.id) || 0;
          const percent = totalPicks ? Math.round((count / totalPicks) * 100) : 0;
          const selected = userPick?.optionId === option.id;
          const winner = market.resolvedOptionId === option.id;
          return (
            <button
              key={option.id}
              className={`option-btn ${selected ? 'selected' : ''} ${winner ? 'winner' : ''}`}
              disabled={market.status !== 'open'}
              onClick={() => onPick(market.id, option.id)}
            >
              <span>{option.label}</span>
              {showPublicPicks ? <span>{count} · {percent}%</span> : <span>{selected ? 'Your pick' : 'Pick'}</span>}
            </button>
          );
        })}
      </div>
      {market.status === 'open' && userPick && <p className="hint">You can change this pick until Frank locks the market.</p>}
      {market.status === 'locked' && <PublicPicks market={market} picks={picks} />}
      {market.status === 'resolved' && <p className="winner-line">Winner: {market.options.find((option) => option.id === market.resolvedOptionId)?.label}</p>}
    </article>
  );
}

function PublicPicks({ market, picks }) {
  const marketPicks = picks.filter((pick) => pick.marketId === market.id);
  if (marketPicks.length === 0) return <p className="hint">No picks were submitted before lock.</p>;
  return <p className="hint">Picks are public now that the market is locked.</p>;
}

function Leaderboard({ rows }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Season Leaderboard</p>
        <h2>Weighted standings</h2>
      </div>
      <div className="leaderboard-list">
        {rows.map((row, index) => (
          <div className="leader-row" key={row.id}>
            <span className="rank">#{index + 1}</span>
            <TeamBadge player={row} />
            <div>
              <strong>{row.displayName}</strong>
              <span>{row.dynastyTeam} · {row.correct}/{row.resolvedPicks} correct · {row.accuracy}%</span>
            </div>
            <strong>{row.points} pts</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function AdminPanel({ state, setState }) {
  const [draft, setDraft] = useState({ title: '', description: '', options: '', pointValue: 1 });

  function updateMarket(marketId, patch) {
    setState((prev) => ({ ...prev, markets: prev.markets.map((market) => (market.id === marketId ? { ...market, ...patch } : market)) }));
  }

  function createMarket(event) {
    event.preventDefault();
    const options = draft.options.split(',').map((item) => item.trim()).filter(Boolean);
    if (!draft.title.trim() || options.length < 2) return;
    const id = draft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || crypto.randomUUID();
    setState((prev) => ({
      ...prev,
      markets: [
        ...prev.markets,
        {
          id,
          title: draft.title.trim(),
          description: draft.description.trim(),
          status: 'open',
          lockLabel: 'Kickoff',
          pointValue: Number(draft.pointValue || 1),
          options: options.map((label) => ({ id: `${id}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, label })),
          resolvedOptionId: null,
        },
      ],
    }));
    setDraft({ title: '', description: '', options: '', pointValue: 1 });
  }

  return (
    <section className="panel admin-panel">
      <div className="section-heading">
        <p className="eyebrow">Commissioner Controls</p>
        <h2>Admin console</h2>
      </div>
      <form className="admin-form" onSubmit={createMarket}>
        <input placeholder="Market title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
        <input placeholder="Description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        <input placeholder="Options, comma separated" value={draft.options} onChange={(event) => setDraft({ ...draft, options: event.target.value })} />
        <input type="number" min="1" placeholder="Point value" value={draft.pointValue} onChange={(event) => setDraft({ ...draft, pointValue: event.target.value })} />
        <button className="primary-btn">Create market</button>
      </form>
      <div className="admin-market-list">
        {state.markets.map((market) => (
          <article className="admin-market" key={market.id}>
            <div>
              <strong>{market.title}</strong>
              <span>{market.status} · {market.pointValue} pt{market.pointValue === 1 ? '' : 's'}</span>
            </div>
            <div className="admin-actions">
              <button disabled={market.status !== 'open'} onClick={() => updateMarket(market.id, { status: 'locked' })}>Lock</button>
              <button disabled={market.status === 'open'} onClick={() => updateMarket(market.id, { status: 'open', resolvedOptionId: null })}>Reopen</button>
              {market.options.map((option) => (
                <button key={option.id} disabled={market.status === 'open'} onClick={() => updateMarket(market.id, { status: 'resolved', resolvedOptionId: option.id })}>
                  Resolve: {option.label}
                </button>
              ))}
              <button className="danger" onClick={() => setState((prev) => ({ ...prev, markets: prev.markets.filter((item) => item.id !== market.id), picks: prev.picks.filter((pick) => pick.marketId !== market.id) }))}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [state, setStateValue] = useState(loadState);
  const [playerId, setPlayerId] = useState(() => localStorage.getItem(SESSION_KEY) || '');
  const [tab, setTab] = useState('markets');
  const currentPlayer = state.players.find((player) => player.id === playerId);

  function setState(updater) {
    setStateValue((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveState(next);
      return next;
    });
  }

  function login(nextPlayerId) {
    localStorage.setItem(SESSION_KEY, nextPlayerId);
    setPlayerId(nextPlayerId);
  }

  function signOut() {
    localStorage.removeItem(SESSION_KEY);
    setPlayerId('');
  }

  function handlePick(marketId, optionId) {
    setState((prev) => {
      const market = prev.markets.find((item) => item.id === marketId);
      if (!market || market.status !== 'open') return prev;
      const remainingPicks = prev.picks.filter((pick) => !(pick.playerId === currentPlayer.id && pick.marketId === marketId));
      return { ...prev, picks: [...remainingPicks, { playerId: currentPlayer.id, marketId, optionId, updatedAt: new Date().toISOString() }] };
    });
  }

  const leaderboard = useMemo(() => calculateLeaderboard(state.players, state.markets, state.picks), [state]);
  const groupedMarkets = useMemo(() => ({
    open: state.markets.filter((market) => market.status === 'open'),
    locked: state.markets.filter((market) => market.status === 'locked'),
    resolved: state.markets.filter((market) => market.status === 'resolved'),
  }), [state.markets]);

  if (!currentPlayer) return <LoginScreen players={state.players} onLogin={login} />;

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">No-cash sportsbook parody</p>
          <h1>Waiting on the World to Change</h1>
          <p>Private NCAA dynasty markets. Fake odds. Real group-chat receipts.</p>
        </div>
        <div className="user-card">
          <TeamBadge player={currentPlayer} />
          <div>
            <strong>{currentPlayer.displayName}</strong>
            <span>{currentPlayer.dynastyTeam} · {currentPlayer.role}</span>
          </div>
          <button onClick={signOut}>Switch user</button>
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === 'markets' ? 'active' : ''} onClick={() => setTab('markets')}>Markets</button>
        <button className={tab === 'leaderboard' ? 'active' : ''} onClick={() => setTab('leaderboard')}>Leaderboard</button>
        {currentPlayer.role === 'admin' && <button className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')}>Admin</button>}
      </nav>

      <p className="disclaimer">Entertainment only. No real gambling, no money exchanged, no prizes beyond deeply annoying bragging rights.</p>

      {tab === 'markets' && (
        <main className="market-sections">
          {Object.entries(groupedMarkets).map(([status, markets]) => (
            <section className="panel" key={status}>
              <div className="section-heading">
                <p className="eyebrow">{status}</p>
                <h2>{status[0].toUpperCase() + status.slice(1)} markets</h2>
              </div>
              <div className="market-grid">
                {markets.map((market) => <MarketCard key={market.id} market={market} picks={state.picks} currentPlayer={currentPlayer} onPick={handlePick} />)}
              </div>
              {markets.length === 0 && <p className="hint">No {status} markets yet.</p>}
            </section>
          ))}
        </main>
      )}

      {tab === 'leaderboard' && <Leaderboard rows={leaderboard} />}
      {tab === 'admin' && currentPlayer.role === 'admin' && <AdminPanel state={state} setState={setState} />}
    </div>
  );
}
