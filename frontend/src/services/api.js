const API_BASE = "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed." }));
    throw new Error(error.detail || "Request failed.");
  }

  return response.json();
}

export const api = {
  createRoom: (payload) =>
    request("/create-room", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  joinRoom: (payload) =>
    request("/join-room", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  startGame: (payload) =>
    request("/start-game", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  rollDice: (payload) =>
    request("/roll-dice", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  moveToken: (payload) =>
    request("/move-token", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getRoom: (roomId) => request(`/room/${roomId}`),
};
