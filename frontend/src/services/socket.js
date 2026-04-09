const WS_BASE = "ws://localhost:8000";

export function connectToRoom(roomId, playerId, onMessage) {
  const socket = new WebSocket(`${WS_BASE}/ws/${roomId}?player_id=${playerId}`);

  socket.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    if (payload.type === "game_state") {
      onMessage(payload.data);
    }
  };

  return socket;
}
