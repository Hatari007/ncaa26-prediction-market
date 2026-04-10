export function Leaderboard({ rows }) {
  return (
    <section>
      <h2>Leaderboard</h2>
      <p className="muted">Ranked by correct resolved picks.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Correct</th>
              <th>Total Resolved Picks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.user_id}>
                <td>{i + 1}</td>
                <td>{row.display_name}</td>
                <td>{row.correct_count}</td>
                <td>{row.resolved_count}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4}>No resolved picks yet. Everybody is undefeated-ish.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
