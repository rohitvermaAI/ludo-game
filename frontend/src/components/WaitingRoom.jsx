export default function WaitingRoom({
  roomId,
  gameState,
  playerId,
  onStart,
  loading,
}) {
  const hostPlayer = gameState.players.find((player) => player.is_host);
  const isHost = playerId === hostPlayer?.id;
  const everyoneJoined = gameState.players.length === gameState.max_players;

  return (
    <section className="lobby-card">
      <div className="lobby-header">
        <div>
          <p className="eyebrow">Waiting Room</p>
          <h2>Room {roomId}</h2>
        </div>
        <div className="room-badge">
          {gameState.players.length}/{gameState.max_players} Players
        </div>
      </div>

      <p className="status-text">{gameState.message}</p>

      <div className="waiting-grid">
        {gameState.players.map((player) => (
          <article key={player.id} className={`waiting-player ${player.color}`}>
            <span className="player-dot" />
            <div>
              <strong>{player.name}</strong>
              <p>{player.is_host ? "Host" : "Guest"}</p>
            </div>
          </article>
        ))}
      </div>

      {isHost ? (
        <button
          className="primary-button"
          disabled={!everyoneJoined || loading}
          onClick={onStart}
        >
          {loading ? "Starting..." : "Start Game"}
        </button>
      ) : (
        <p className="helper-copy">The host will start the match once everyone has joined.</p>
      )}
    </section>
  );
}
