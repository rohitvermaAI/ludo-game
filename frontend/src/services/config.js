const hostname =
  typeof window !== "undefined" ? window.location.hostname : "localhost";

const apiHost = import.meta.env.VITE_API_HOST || hostname;
const apiPort = import.meta.env.VITE_API_PORT || "8000";
const apiProtocol = import.meta.env.VITE_API_PROTOCOL || "http";
const wsProtocol = import.meta.env.VITE_WS_PROTOCOL || (apiProtocol === "https" ? "wss" : "ws");

export const API_BASE = import.meta.env.VITE_API_BASE || `${apiProtocol}://${apiHost}:${apiPort}`;
export const WS_BASE = import.meta.env.VITE_WS_BASE || `${wsProtocol}://${apiHost}:${apiPort}`;
