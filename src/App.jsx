import { useEffect, useMemo, useState } from 'react';
import { AuthGate } from './components/AuthGate';
import { DisplayNameSetup } from './components/DisplayNameSetup';
import { MarketSection } from './components/MarketSection';
import { Leaderboard } from './components/Leaderboard';
import { AdminPanel } from './components/AdminPanel';
import { supabase } from './lib/supabase';

function classifyMarkets(markets) {
  const now = new Date();
  const open = [];
  const locked = [];
  const resolved = [];

  for (const market of markets) {
    if (market.resolved_option_id) {
      resolved.push(market);
    } else if (new Date(market.lock_time) <= now) {
      locked.push(market);
    } else {
      open.push(market);
    }
  }

  return { open, locked, resolved };
}

function mapMarketRows(markets, picksByMarket, picksByOption) {
  return markets.map((market) => ({
    ...market,
    options: market.options.map((option) => ({
      ...option,
      pick_count: picksByOption.get(option.id) ?? 0,
    })),
    user_pick_option_id: picksByMarket.get(market.id) ?? null,
  }));
}

async function fetchData(userId) {
  const [{ data: profile, error: profileError }, { data: marketsRaw, error: marketsError }, { data: picksRaw, error: picksError }, { data: allPicksRaw, error: allPicksError }] =
    await Promise.all([
      supabase.from('profiles').select('id, display_name, is_admin').eq('id', userId).maybeSingle(),
      supabase
        .from('markets')
        .select('id, title, description, lock_time, resolved_option_id, created_at, options:market_options(id, label)')
        .order('created_at', { ascending: false }),
      supabase.from('picks').select('market_id, option_id').eq('user_id', userId),
      supabase.from('picks').select('market_id, option_id, user_id, markets!inner(resolved_option_id)'),
    ]);

  if (profileError || marketsError || picksError || allPicksError) {
    throw new Error(profileError?.message || marketsError?.message || picksError?.message || allPicksError?.message);
  }

  const picksByMarket = new Map((picksRaw ?? []).map((pick) => [pick.market_id, pick.option_id]));
  const picksByOption = new Map();

  for (const pick of allPicksRaw ?? []) {
    picksByOption.set(pick.option_id, (picksByOption.get(pick.option_id) ?? 0) + 1);
  }

  const markets = mapMarketRows(marketsRaw ?? [], picksByMarket, picksByOption);

  const leaderboardMap = new Map();
  for (const pick of allPicksRaw ?? []) {
    const resolvedOption = pick.markets?.resolved_option_id;
    if (!resolvedOption) continue;
    const entry = leaderboardMap.get(pick.user_id) ?? { user_id: pick.user_id, correct_count: 0, resolved_count: 0 };
    entry.resolved_count += 1;
    if (resolvedOption === pick.option_id) {
      entry.correct_count += 1;
    }
    leaderboardMap.set(pick.user_id, entry);
  }

  const userIds = [...leaderboardMap.keys()];
  const { data: leaderboardProfiles, error: leaderboardProfileError } = userIds.length
    ? await supabase.from('profiles').select('id, display_name').in('id', userIds)
    : { data: [], error: null };

  if (leaderboardProfileError) {
    throw new Error(leaderboardProfileError.message);
  }

  const nameByUserId = new Map((leaderboardProfiles ?? []).map((p) => [p.id, p.display_name ?? 'Unknown Degenerate']));

  const leaderboard = [...leaderboardMap.values()]
    .map((row) => ({ ...row, display_name: nameByUserId.get(row.user_id) ?? 'Anonymous Sharpshooter' }))
    .sort((a, b) => b.correct_count - a.correct_count || b.resolved_count - a.resolved_count);

  return { profile, markets, leaderboard };
}

export default function App() {
  return (
    <AuthGate>
      {(user) => <AppShell user={user} />}
    </AuthGate>
  );
}

function AppShell({ user }) {
  const [tab, setTab] = useState('home');
  const [profile, setProfile] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingPickId, setPendingPickId] = useState(null);
  const [nowIso, setNowIso] = useState(new Date().toISOString());

  // Refresh clock every minute so open/locked sections move without full refresh.
  useEffect(() => {
    const timer = setInterval(() => setNowIso(new Date().toISOString()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const reload = async () => {
    setLoading(true);
    setError('');

    try {
      const payload = await fetchData(user.id);
      setProfile(payload.profile);
      setMarkets(payload.markets);
      setLeaderboard(payload.leaderboard);
    } catch (e) {
      setError(e.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [user.id]);

  const grouped = useMemo(() => classifyMarkets(markets), [markets]);

  const saveDisplayName = async (displayName) => {
    setBusy(true);
    setError('');
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, display_name: displayName, is_admin: false }, { onConflict: 'id' });
    if (upsertError) {
      setError(upsertError.message);
    } else {
      await reload();
    }
    setBusy(false);
  };

  const handlePick = async (marketId, optionId) => {
    setPendingPickId(marketId);
    setError('');

    const market = markets.find((m) => m.id === marketId);
    if (!market) {
      setError('Market not found.');
      setPendingPickId(null);
      return;
    }

    if (market.user_pick_option_id) {
      setError('You already made a pick for this market.');
      setPendingPickId(null);
      return;
    }

    if (new Date(market.lock_time) <= new Date() || market.resolved_option_id) {
      setError('This market is locked.');
      setPendingPickId(null);
      return;
    }

    const { error: pickError } = await supabase.from('picks').insert({
      user_id: user.id,
      market_id: marketId,
      option_id: optionId,
    });

    if (pickError) {
      setError(pickError.message);
    } else {
      await reload();
    }

    setPendingPickId(null);
  };

  const adminAction = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action();
      await reload();
    } catch (e) {
      setError(e.message || 'Admin action failed.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="center-card">Loading markets...</div>;

  if (!profile?.display_name) {
    return (
      <div className="shell">
        {error && <p className="error-banner">{error}</p>}
        <DisplayNameSetup onSave={saveDisplayName} loading={busy} />
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <h1>🎲 Totally Legit Sportsbook</h1>
          <p className="muted">Welcome, {profile.display_name}</p>
        </div>
        <div className="top-actions">
          <button className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>Home</button>
          <button className={tab === 'leaderboard' ? 'active' : ''} onClick={() => setTab('leaderboard')}>Leaderboard</button>
          {profile.is_admin && (
            <button className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')}>Admin</button>
          )}
          <button onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </header>

      <p className="disclaimer">Entertainment only. No real gambling, no prizes, no tears (okay maybe a few tears).</p>
      {error && <p className="error-banner">{error}</p>}

      {tab === 'home' && (
        <main className="stack">
          <MarketSection title="Open Markets" markets={grouped.open} nowIso={nowIso} onPick={handlePick} pendingPickId={pendingPickId} />
          <MarketSection title="Locked Markets" markets={grouped.locked} nowIso={nowIso} onPick={handlePick} pendingPickId={pendingPickId} />
          <MarketSection title="Resolved Markets" markets={grouped.resolved} nowIso={nowIso} onPick={handlePick} pendingPickId={pendingPickId} />
        </main>
      )}

      {tab === 'leaderboard' && <Leaderboard rows={leaderboard} />}

      {tab === 'admin' && profile.is_admin && (
        <AdminPanel
          markets={markets}
          busy={busy}
          onCreate={(payload) =>
            adminAction(async () => {
              if (!payload.title?.trim()) throw new Error('Title is required.');
              if (!payload.lock_time) throw new Error('Lock time is required.');
              const { error } = await supabase.from('markets').insert({
                title: payload.title.trim(),
                description: payload.description?.trim() || '',
                lock_time: new Date(payload.lock_time).toISOString(),
              });
              if (error) throw error;
            })
          }
          onUpdate={(marketId, values) =>
            adminAction(async () => {
              const { error } = await supabase.from('markets').update(values).eq('id', marketId);
              if (error) throw error;
            })
          }
          onAddOption={(marketId, label) =>
            adminAction(async () => {
              const { error } = await supabase.from('market_options').insert({ market_id: marketId, label });
              if (error) throw error;
            })
          }
          onResolve={(marketId, optionId) =>
            adminAction(async () => {
              const { error } = await supabase.from('markets').update({ resolved_option_id: optionId }).eq('id', marketId);
              if (error) throw error;
            })
          }
        />
      )}
    </div>
  );
}
