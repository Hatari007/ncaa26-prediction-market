export default function MarketCard({ market }) {
  return (
    <article className="card market-card">
      <div className="market-header">
        <h3>{market.title}</h3>
        <span className={`pill ${market.state}`}>{market.state}</span>
      </div>
      <p>{market.description}</p>
      <p className="meta">Closes: {new Date(market.closesAt).toLocaleString()}</p>

      <div className="options-row">
        {market.options.map((option) => (
          <button
            key={`${market.id}-${option}`}
            disabled={market.state !== 'open'}
            title={market.state === 'open' ? 'One pick per market in backend rules.' : 'Market unavailable'}
          >
            {option}
          </button>
        ))}
      </div>

      {market.state === 'resolved' && <p className="resolution">Resolved: {market.resolution}</p>}
    </article>
  );
}
