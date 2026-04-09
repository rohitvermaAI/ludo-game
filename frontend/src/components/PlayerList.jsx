export default function PlayerList({ players, currentTurn, winner }) {
  return (
    <div className="player-list">
      {players.map((player) => (
        <article
          key={player.id}
          className={`player-card ${player.color} ${currentTurn === player.id ? "active" : ""} ${
            winner === player.id ? "winner" : ""
          }`}
        >
          <div className="player-title">
            <span className="player-dot" />
            <div>
              <strong>{player.name}</strong>
              <p>{player.color}</p>
            </div>
          </div>
          <div className="player-stats">
            <span>{player.finished_tokens}/4 home</span>
            <span>{player.connected ? "Online" : "Offline"}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
