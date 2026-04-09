from fastapi import APIRouter

from models.schemas import (
    CreateRoomRequest,
    JoinRoomRequest,
    MoveTokenRequest,
    RoomPlayerRequest,
)
from services.game_manager import game_manager
from services.websocket_manager import websocket_manager

router = APIRouter()


@router.post("/create-room")
async def create_room(payload: CreateRoomRequest) -> dict:
    return await game_manager.create_room(payload.player_name, payload.max_players)


@router.post("/join-room")
async def join_room(payload: JoinRoomRequest) -> dict:
    room_id = payload.room_id.upper()
    result = await game_manager.join_room(room_id, payload.player_name)
    await websocket_manager.broadcast(room_id, {"type": "game_state", "data": result["game_state"]})
    return result


@router.post("/start-game")
async def start_game(payload: RoomPlayerRequest) -> dict:
    state = await game_manager.start_game(payload.room_id.upper(), payload.player_id)
    await websocket_manager.broadcast(payload.room_id.upper(), {"type": "game_state", "data": state})
    return state


@router.post("/roll-dice")
async def roll_dice(payload: RoomPlayerRequest) -> dict:
    state = await game_manager.roll_dice(payload.room_id.upper(), payload.player_id)
    await websocket_manager.broadcast(payload.room_id.upper(), {"type": "game_state", "data": state})
    return state


@router.post("/move-token")
async def move_token(payload: MoveTokenRequest) -> dict:
    state = await game_manager.move_token(payload.room_id.upper(), payload.player_id, payload.token_index)
    await websocket_manager.broadcast(payload.room_id.upper(), {"type": "game_state", "data": state})
    return state


@router.get("/room/{room_id}")
async def get_room(room_id: str) -> dict:
    return await game_manager.get_room_state(room_id.upper())
