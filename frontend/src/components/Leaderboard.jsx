export default function Leaderboard({ leaderboard, winnerName }) {
  return (
    <section className="leaderboard-card">
      <p className="eyebrow">Match Results</p>
      <h3>{winnerName} wins the game</h3>
      <div className="leaderboard-list">
        {leaderboard.map((entry) => (
          <div key={entry.player_id} className={`leaderboard-row ${entry.color}`}>
            <span>#{entry.rank}</span>
            <strong>{entry.name}</strong>
            <span>{entry.finished_tokens} token(s) home</span>
          </div>
        ))}
      </div>
    </section>
  );
}
