function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

export function MarketCard({ market, nowIso, onPick, pendingPickId }) {
  const now = new Date(nowIso);
  const lockTime = new Date(market.lock_time);
  const isLocked = now >= lockTime || Boolean(market.resolved_option_id);
  const totalPicks = market.options.reduce((sum, option) => sum + option.pick_count, 0);
  const userPick = market.user_pick_option_id;

  return (
    <article className="market-card">
      <header>
        <h3>{market.title}</h3>
        <p>{market.description}</p>
      </header>

      <div className="market-meta">
        <span>🔒 Locks: {lockTime.toLocaleString()}</span>
        <span>🎟️ Picks: {totalPicks}</span>
      </div>

      <ul className="option-list">
        {market.options.map((option) => {
          const pct = totalPicks ? option.pick_count / totalPicks : 0;
          const isWinner = market.resolved_option_id === option.id;
          const isUserPick = userPick === option.id;

          return (
            <li key={option.id} className={`option-row ${isWinner ? 'winner' : ''}`}>
              <div className="option-copy">
                <strong>{option.label}</strong>
                <span>{option.pick_count} picks • {formatPercent(pct)}</span>
                {isUserPick && <em>Your pick ✅</em>}
                {isWinner && <em>Winning option 🏆</em>}
              </div>
              <button
                onClick={() => onPick(market.id, option.id)}
                disabled={Boolean(userPick) || isLocked || pendingPickId === market.id}
              >
                {isUserPick ? 'Picked' : 'Pick'}
              </button>
            </li>
          );
        })}
      </ul>

      {isLocked && !market.resolved_option_id && <p className="muted">Market locked. No more picks.</p>}
      {market.resolved_option_id && <p className="muted">Resolved and scored.</p>}
    </article>
  );
}
