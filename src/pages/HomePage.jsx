import MarketCard from '../components/MarketCard';

export default function HomePage({ markets }) {
  return (
    <section>
      <h1>Active Markets</h1>
      <p className="page-intro">Bet fake internet points on very real digital coaching decisions.</p>
      <div className="market-grid">
        {markets.map((market) => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>
    </section>
  );
}
