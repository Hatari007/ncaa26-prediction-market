import { MarketCard } from './MarketCard';

export function MarketSection({ title, markets, nowIso, onPick, pendingPickId }) {
  return (
    <section>
      <h2>{title}</h2>
      {markets.length === 0 ? (
        <p className="empty">No markets in this section yet.</p>
      ) : (
        <div className="market-grid">
          {markets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              nowIso={nowIso}
              onPick={onPick}
              pendingPickId={pendingPickId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
