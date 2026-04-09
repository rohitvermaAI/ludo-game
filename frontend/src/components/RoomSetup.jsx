import { useState } from "react";

export default function RoomSetup({ onCreateRoom, onJoinRoom, loading, error }) {
  const [createName, setCreateName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("2");

  const handleCreate = (event) => {
    event.preventDefault();
    onCreateRoom({
      player_name: createName.trim(),
      max_players: Number(maxPlayers),
    });
  };

  const handleJoin = (event) => {
    event.preventDefault();
    onJoinRoom({
      room_id: roomId.trim().toUpperCase(),
      player_name: joinName.trim(),
    });
  };

  return (
    <div className="hero-layout">
      <section className="hero-card">
        <p className="eyebrow">Realtime Multiplayer</p>
        <h1>Ludo Arena</h1>
        <p className="hero-copy">
          Create a room, invite friends, and play a full 2 to 4 player Ludo match with
          live board updates, dice rolls, and turn validation.
        </p>

        <div className="room-panels">
          <form className="panel" onSubmit={handleCreate}>
            <h2>Create Room</h2>
            <label>
              Your name
              <input
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder="Host name"
                maxLength={20}
                required
              />
            </label>
            <label>
              Number of players
              <select
                value={maxPlayers}
                onChange={(event) => setMaxPlayers(event.target.value)}
              >
                <option value="2">2 Players</option>
                <option value="3">3 Players</option>
                <option value="4">4 Players</option>
              </select>
            </label>
            <button className="primary-button" disabled={loading}>
              {loading ? "Creating..." : "Create Game"}
            </button>
          </form>

          <form className="panel" onSubmit={handleJoin}>
            <h2>Join Room</h2>
            <label>
              Room ID
              <input
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
                placeholder="Enter room code"
                maxLength={6}
                required
              />
            </label>
            <label>
              Your name
              <input
                value={joinName}
                onChange={(event) => setJoinName(event.target.value)}
                placeholder="Player name"
                maxLength={20}
                required
              />
            </label>
            <button className="secondary-button" disabled={loading}>
              {loading ? "Joining..." : "Join Room"}
            </button>
          </form>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}
      </section>
    </div>
  );
}
