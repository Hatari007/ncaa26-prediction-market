export default function LeaderboardPage({ leaderboard }) {
  return (
    <section>
      <h1>Leaderboard</h1>
      <p className="page-intro">Correct picks only. No moral victories.</p>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>User</th>
              <th>Correct Picks</th>
              <th>Total Picks</th>
              <th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row, index) => {
              const accuracy = ((row.correctPicks / row.totalPicks) * 100).toFixed(1);
              return (
                <tr key={row.id}>
                  <td>{index + 1}</td>
                  <td>{row.displayName}</td>
                  <td>{row.correctPicks}</td>
                  <td>{row.totalPicks}</td>
                  <td>{accuracy}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
