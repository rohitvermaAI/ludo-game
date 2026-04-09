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
          <div className="player-avatar" aria-hidden="true">
            <span className="player-dot" />
          </div>
          <div className="player-meta">
            <strong>{player.name}</strong>
            <span className="player-status">
              {winner === player.id
                ? "Winner"
                : currentTurn === player.id
                  ? "Turn"
                  : player.connected
                    ? "Ready"
                    : "Offline"}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
