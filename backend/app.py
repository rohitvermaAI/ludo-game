from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from routes.game_routes import router as game_router
from services.game_manager import game_manager
from services.websocket_manager import websocket_manager

app = FastAPI(title="Multiplayer Ludo API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(game_router)


@app.get("/")
async def root() -> dict:
    return {"message": "Multiplayer Ludo API is running."}


@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str) -> None:
    normalized_room_id = room_id.upper()
    player_id = websocket.query_params.get("player_id")

    await websocket_manager.connect(normalized_room_id, websocket)
    if player_id:
        game_manager.mark_player_connection(normalized_room_id, player_id, True)

    try:
        state = await game_manager.get_room_state(normalized_room_id)
        await websocket.send_json({"type": "game_state", "data": state})

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect(normalized_room_id, websocket)
        if player_id:
            game_manager.mark_player_connection(normalized_room_id, player_id, False)
            state = await game_manager.get_room_state(normalized_room_id)
            await websocket_manager.broadcast(
                normalized_room_id,
                {"type": "game_state", "data": state},
            )
