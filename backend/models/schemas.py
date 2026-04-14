from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


PlayerColor = Literal["green", "red", "yellow", "blue"]
RoomStatus = Literal["waiting", "playing", "finished"]


class PlayerState(BaseModel):
    id: str
    name: str
    color: PlayerColor
    tokens: List[int] = Field(default_factory=lambda: [-1, -1, -1, -1])
    finished_tokens: int = 0
    is_host: bool = False
    connected: bool = True


class LeaderboardEntry(BaseModel):
    player_id: str
    name: str
    color: PlayerColor
    finished_tokens: int
    rank: int


class GameRoom(BaseModel):
    room_id: str
    max_players: int
    status: RoomStatus = "waiting"
    players: List[PlayerState] = Field(default_factory=list)
    current_turn: Optional[str] = None
    dice_value: Optional[int] = None
    last_roll: Optional[int] = None
    last_move: Optional[dict] = None
    winner: Optional[str] = None
    message: str = "Waiting for players..."

    @field_validator("max_players")
    @classmethod
    def validate_max_players(cls, value: int) -> int:
        if value not in {2, 3, 4}:
            raise ValueError("max_players must be 2, 3, or 4")
        return value


class CreateRoomRequest(BaseModel):
    player_name: str
    max_players: int


class JoinRoomRequest(BaseModel):
    room_id: str
    player_name: str


class RoomPlayerRequest(BaseModel):
    room_id: str
    player_id: str


class MoveTokenRequest(RoomPlayerRequest):
    token_index: int
