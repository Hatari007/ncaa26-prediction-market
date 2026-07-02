import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabase';

const SESSION_KEY = 'wotwtc-player-id';

const defaultSiteCopy = {
  loginEyebrow: 'NCAA 26 Dynasty Market',
  siteTitle: 'Waiting on the World to Change',
  loginIntro: 'Fake odds, real bragging rights. No money, no payouts, no bookie — just your friends being confidently wrong.',
  heroEyebrow: 'No-cash sportsbook parody',
  heroSubtitle: 'Private NCAA dynasty markets. Fake odds. Real group-chat receipts.',
  disclaimer: 'Entertainment only. No real gambling, no money exchanged, no prizes beyond deeply annoying bragging rights.',
};

function fromDbSiteCopy(row) {
  if (!row) return defaultSiteCopy;
  return {
    loginEyebrow: row.login_eyebrow,
    siteTitle: row.site_title,
    loginIntro: row.login_intro,
    heroEyebrow: row.hero_eyebrow,
    heroSubtitle: row.hero_subtitle,
    disclaimer: row.disclaimer,
  };
}

function toDbSiteCopy(copy) {
  return {
    id: 'default',
    login_eyebrow: copy.loginEyebrow,
    site_title: copy.siteTitle,
    login_intro: copy.loginIntro,
    hero_eyebrow: copy.heroEyebrow,
    hero_subtitle: copy.heroSubtitle,
    disclaimer: copy.disclaimer,
    updated_at: new Date().toISOString(),
  };
}

function fromDbPlayer(row) {
  return {
    id: row.id,
    displayName: row.display_name,
    dynastyTeam: row.dynasty_team,
    role: row.role,
    logo: row.logo,
    logoUrl: row.logo_url,
  };
}

function fromDbOption(row) {
  return {
    id: row.id,
    marketId: row.market_id,
    label: row.label,
    sortOrder: row.sort_order,
  };
}

function fromDbMarket(row, optionsByMarket) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    lockLabel: row.lock_label,
    pointValue: row.point_value,
    resolvedOptionId: row.resolved_option_id,
    options: optionsByMarket.get(row.id) || [],
  };
}

function fromDbPick(row) {
  return {
    id: row.id,
    playerId: row.player_id,
    marketId: row.market_id,
    optionId: row.option_id,
  };
}

function toSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || crypto.randomUUID();
}

async function fetchSharedState() {
  const [siteResult, playersResult, marketsResult, optionsResult, picksResult] = await Promise.all([
    supabase.from('site_copy').select('*').eq('id', 'default').maybeSingle(),
    supabase.from('players').select('*').order('created_at', { ascending: true }),
    supabase.from('markets').select('*').order('created_at', { ascending: true }),
    supabase.from('market_options').select('*').order('sort_order', { ascending: true }),
    supabase.from('picks').select('*').order('created_at', { ascending: true }),
  ]);

  const firstError = siteResult.error || playersResult.error || marketsResult.error || optionsResult.error || picksResult.error;
  if (firstError) throw firstError;

  const optionsByMarket = new Map();
  for (const option of optionsResult.data || []) {
    const mapped = fromDbOption(option);
    const current = optionsByMarket.get(mapped.marketId) || [];
    current.push(mapped);
    optionsByMarket.set(mapped.marketId, current);
  }

  return {
    siteCopy: fromDbSiteCopy(siteResult.data),
    players: (playersResult.data || []).map(fromDbPlayer),
    markets: (marketsResult.data || []).map((market) => fromDbMarket(market, optionsByMarket)),
    picks: (picksResult.data || []).map(fromDbPick),
  };
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
    <span className="team-badge" title={`${player.dynastyTeam} logo`}>
      {player.logoUrl ? <img src={player.logoUrl} alt={`${player.dynastyTeam} logo`} loading="lazy" /> : player.logo}
    </span>
  );
}

function LoginScreen({ players, siteCopy, onLogin }) {
  const [selected, setSelected] = useState(players[0]?.id || '');

  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">{siteCopy.loginEyebrow}</p>
        <h1>{siteCopy.siteTitle}</h1>
        <p className="hero-copy">{siteCopy.loginIntro}</p>
        <label>
          Choose your display name
          <select value={selected} onChange={(event) => setSelected(event.target.value)}>
            {players.map((player) => (
              <option key={player.id} value={player.id}>{player.displayName} · {player.dynastyTeam}</option>
            ))}
          </select>
        </label>
        <button className="primary-btn" onClick={() => onLogin(selected)} disabled={!selected}>Enter the book</button>
        <p className="fine-print">Entertainment only. Display-name login is intentionally casual for this private group.</p>
      </section>
    </main>
  );
}

function MarketCard({ market, picks, players, currentPlayer, onPick, busy }) {
  const userPick = picks.find((pick) => pick.marketId === market.id && pick.playerId === currentPlayer.id);
  const counts = getPickCounts(market, picks);
  const totalPicks = [...counts.values()].reduce((sum, value) => sum + value, 0);
  const showPublicPicks = market.status !== 'open';
  const playerById = new Map(players.map((player) => [player.id, player]));

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
          const optionPickers = picks
            .filter((pick) => pick.marketId === market.id && pick.optionId === option.id)
            .map((pick) => playerById.get(pick.playerId)?.displayName || 'Unknown');
          return (
            <button
              key={option.id}
              className={`option-btn ${selected ? 'selected' : ''} ${winner ? 'winner' : ''}`}
              disabled={market.status !== 'open' || busy}
              onClick={() => onPick(market.id, option.id)}
            >
              <span className="option-main">
                <span>{option.label}</span>
                {showPublicPicks && <small>{optionPickers.length ? optionPickers.join(', ') : 'No picks'}</small>}
              </span>
              {showPublicPicks ? <span>{count} · {percent}%</span> : <span>{selected ? 'Your pick' : 'Pick'}</span>}
            </button>
          );
        })}
      </div>
      {market.status === 'open' && userPick && <p className="hint">You can change this pick until Frank locks the market.</p>}
      {market.status === 'locked' && <p className="hint">Picks are public now that the market is locked.</p>}
      {market.status === 'resolved' && <p className="winner-line">Winner: {market.options.find((option) => option.id === market.resolvedOptionId)?.label}</p>}
    </article>
  );
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

function AdminPanel({ state, runAction }) {
  const [draft, setDraft] = useState({ title: '', description: '', options: '', pointValue: 1 });
  const [copyDraft, setCopyDraft] = useState(state.siteCopy);

  async function updateMarket(marketId, patch) {
    const dbPatch = {};
    if ('title' in patch) dbPatch.title = patch.title;
    if ('description' in patch) dbPatch.description = patch.description;
    if ('lockLabel' in patch) dbPatch.lock_label = patch.lockLabel;
    if ('pointValue' in patch) dbPatch.point_value = patch.pointValue;
    if ('status' in patch) dbPatch.status = patch.status;
    if ('resolvedOptionId' in patch) dbPatch.resolved_option_id = patch.resolvedOptionId;
    dbPatch.updated_at = new Date().toISOString();

    await runAction(async () => {
      const { error } = await supabase.from('markets').update(dbPatch).eq('id', marketId);
      if (error) throw error;
    });
  }

  async function updateOptionLabel(optionId, label) {
    await runAction(async () => {
      const { error } = await supabase.from('market_options').update({ label }).eq('id', optionId);
      if (error) throw error;
    });
  }

  async function saveSiteCopy(event) {
    event.preventDefault();
    await runAction(async () => {
      const { error } = await supabase.from('site_copy').upsert(toDbSiteCopy(copyDraft));
      if (error) throw error;
    });
  }

  async function createMarket(event) {
    event.preventDefault();
    const options = draft.options.split(',').map((item) => item.trim()).filter(Boolean);
    if (!draft.title.trim() || options.length < 2) return;
    const id = toSlug(draft.title);

    await runAction(async () => {
      const { error: marketError } = await supabase.from('markets').insert({
        id,
        title: draft.title.trim(),
        description: draft.description.trim(),
        status: 'open',
        lock_label: 'Kickoff',
        point_value: Number(draft.pointValue || 1),
        resolved_option_id: null,
      });
      if (marketError) throw marketError;

      const { error: optionsError } = await supabase.from('market_options').insert(
        options.map((label, index) => ({
          id: `${id}-${toSlug(label)}`,
          market_id: id,
          label,
          sort_order: index + 1,
        })),
      );
      if (optionsError) throw optionsError;
    });

    setDraft({ title: '', description: '', options: '', pointValue: 1 });
  }

  return (
    <section className="panel admin-panel">
      <div className="section-heading">
        <p className="eyebrow">Commissioner Controls</p>
        <h2>Admin console</h2>
      </div>

      <form className="admin-form copy-form" onSubmit={saveSiteCopy}>
        <h3>Website text</h3>
        <label>
          Login eyebrow
          <input value={copyDraft.loginEyebrow} onChange={(event) => setCopyDraft({ ...copyDraft, loginEyebrow: event.target.value })} />
        </label>
        <label>
          Site title
          <input value={copyDraft.siteTitle} onChange={(event) => setCopyDraft({ ...copyDraft, siteTitle: event.target.value })} />
        </label>
        <label>
          Login intro
          <textarea value={copyDraft.loginIntro} onChange={(event) => setCopyDraft({ ...copyDraft, loginIntro: event.target.value })} />
        </label>
        <label>
          Hero eyebrow
          <input value={copyDraft.heroEyebrow} onChange={(event) => setCopyDraft({ ...copyDraft, heroEyebrow: event.target.value })} />
        </label>
        <label>
          Hero subtitle
          <textarea value={copyDraft.heroSubtitle} onChange={(event) => setCopyDraft({ ...copyDraft, heroSubtitle: event.target.value })} />
        </label>
        <label>
          Disclaimer
          <textarea value={copyDraft.disclaimer} onChange={(event) => setCopyDraft({ ...copyDraft, disclaimer: event.target.value })} />
        </label>
        <button className="primary-btn">Save website text</button>
      </form>

      <form className="admin-form" onSubmit={createMarket}>
        <h3>Create market</h3>
        <input placeholder="Market title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
        <input placeholder="Description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        <input placeholder="Options, comma separated" value={draft.options} onChange={(event) => setDraft({ ...draft, options: event.target.value })} />
        <input type="number" min="1" placeholder="Point value" value={draft.pointValue} onChange={(event) => setDraft({ ...draft, pointValue: event.target.value })} />
        <button className="primary-btn">Create market</button>
      </form>
      <div className="admin-market-list">
        {state.markets.map((market) => (
          <article className="admin-market" key={market.id}>
            <div className="market-edit-grid">
              <label>
                Market title
                <input value={market.title} onChange={(event) => updateMarket(market.id, { title: event.target.value })} />
              </label>
              <label>
                Description
                <textarea value={market.description} onChange={(event) => updateMarket(market.id, { description: event.target.value })} />
              </label>
              <label>
                Lock label
                <input value={market.lockLabel} onChange={(event) => updateMarket(market.id, { lockLabel: event.target.value })} />
              </label>
              <label>
                Point value
                <input type="number" min="1" value={market.pointValue} onChange={(event) => updateMarket(market.id, { pointValue: Number(event.target.value || 1) })} />
              </label>
              <div className="option-edit-list">
                <strong>Options</strong>
                {market.options.map((option) => (
                  <input key={option.id} value={option.label} onChange={(event) => updateOptionLabel(option.id, event.target.value)} />
                ))}
              </div>
            </div>
            <div className="admin-actions">
              <button disabled={market.status !== 'open'} onClick={() => updateMarket(market.id, { status: 'locked' })}>Lock</button>
              <button disabled={market.status === 'open'} onClick={() => updateMarket(market.id, { status: 'open', resolvedOptionId: null })}>Reopen</button>
              {market.options.map((option) => (
                <button key={option.id} disabled={market.status === 'open'} onClick={() => updateMarket(market.id, { status: 'resolved', resolvedOptionId: option.id })}>
                  Resolve: {option.label}
                </button>
              ))}
              <button
                className="danger"
                onClick={() => runAction(async () => {
                  const { error } = await supabase.from('markets').delete().eq('id', market.id);
                  if (error) throw error;
                })}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [state, setState] = useState({ players: [], markets: [], picks: [], siteCopy: defaultSiteCopy });
  const [playerId, setPlayerId] = useState(() => localStorage.getItem(SESSION_KEY) || '');
  const [tab, setTab] = useState('markets');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function reload() {
    if (!isSupabaseConfigured) {
      setError('Missing Supabase environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in GitHub secrets.');
      setLoading(false);
      return;
    }

    setError('');
    try {
      const nextState = await fetchSharedState();
      setState(nextState);
      if (playerId && !nextState.players.some((player) => player.id === playerId)) {
        localStorage.removeItem(SESSION_KEY);
        setPlayerId('');
      }
    } catch (e) {
      setError(e.message || 'Could not load shared markets.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function runAction(action) {
    setBusy(true);
    setError('');
    try {
      await action();
      await reload();
    } catch (e) {
      setError(e.message || 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  function login(nextPlayerId) {
    localStorage.setItem(SESSION_KEY, nextPlayerId);
    setPlayerId(nextPlayerId);
  }

  function signOut() {
    localStorage.removeItem(SESSION_KEY);
    setPlayerId('');
  }

  async function handlePick(marketId, optionId) {
    const currentPlayer = state.players.find((player) => player.id === playerId);
    if (!currentPlayer) return;

    await runAction(async () => {
      const { error: pickError } = await supabase.from('picks').upsert(
        {
          player_id: currentPlayer.id,
          market_id: marketId,
          option_id: optionId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'player_id,market_id' },
      );
      if (pickError) throw pickError;
    });
  }

  const currentPlayer = state.players.find((player) => player.id === playerId);
  const leaderboard = useMemo(() => calculateLeaderboard(state.players, state.markets, state.picks), [state]);
  const groupedMarkets = useMemo(() => ({
    open: state.markets.filter((market) => market.status === 'open'),
    locked: state.markets.filter((market) => market.status === 'locked'),
    resolved: state.markets.filter((market) => market.status === 'resolved'),
  }), [state.markets]);

  if (loading) return <div className="login-shell"><section className="login-card">Loading shared markets...</section></div>;

  if (!isSupabaseConfigured) {
    return (
      <main className="login-shell">
        <section className="login-card">
          <p className="eyebrow">Setup needed</p>
          <h1>Supabase is not configured</h1>
          <p className="hero-copy">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as GitHub Actions secrets, then redeploy.</p>
        </section>
      </main>
    );
  }

  if (!currentPlayer) return <LoginScreen players={state.players} siteCopy={state.siteCopy} onLogin={login} />;

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">{state.siteCopy.heroEyebrow}</p>
          <h1>{state.siteCopy.siteTitle}</h1>
          <p>{state.siteCopy.heroSubtitle}</p>
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
        <button onClick={reload} disabled={busy}>Refresh</button>
      </nav>

      <p className="disclaimer">{state.siteCopy.disclaimer}</p>
      {error && <p className="disclaimer">⚠️ {error}</p>}

      {tab === 'markets' && (
        <main className="market-sections">
          {Object.entries(groupedMarkets).map(([status, markets]) => (
            <section className="panel" key={status}>
              <div className="section-heading">
                <p className="eyebrow">{status}</p>
                <h2>{status[0].toUpperCase() + status.slice(1)} markets</h2>
              </div>
              <div className="market-grid">
                {markets.map((market) => <MarketCard key={market.id} market={market} picks={state.picks} players={state.players} currentPlayer={currentPlayer} onPick={handlePick} busy={busy} />)}
              </div>
              {markets.length === 0 && <p className="hint">No {status} markets yet.</p>}
            </section>
          ))}
        </main>
      )}

      {tab === 'leaderboard' && <Leaderboard rows={leaderboard} />}
      {tab === 'admin' && currentPlayer.role === 'admin' && <AdminPanel state={state} runAction={runAction} />}
    </div>
  );
}
