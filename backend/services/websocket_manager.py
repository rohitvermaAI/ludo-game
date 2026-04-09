from __future__ import annotations

from collections import defaultdict
from typing import DefaultDict, List

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self) -> None:
        self._connections: DefaultDict[str, List[WebSocket]] = defaultdict(list)

    async def connect(self, room_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[room_id].append(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket) -> None:
        if room_id not in self._connections:
            return
        self._connections[room_id] = [
            connection
            for connection in self._connections[room_id]
            if connection is not websocket
        ]
        if not self._connections[room_id]:
            self._connections.pop(room_id, None)

    async def broadcast(self, room_id: str, payload: dict) -> None:
        stale_connections: List[WebSocket] = []
        for connection in self._connections.get(room_id, []):
            try:
                await connection.send_json(payload)
            except Exception:
                stale_connections.append(connection)

        for connection in stale_connections:
            self.disconnect(room_id, connection)


websocket_manager = WebSocketManager()
