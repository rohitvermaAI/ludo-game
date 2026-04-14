from __future__ import annotations

import asyncio
import random
import uuid
from typing import Dict

from fastapi import HTTPException

from game_logic.ludo import LudoLogic
from models.schemas import GameRoom, LeaderboardEntry, PlayerState


class GameManager:
    def __init__(self) -> None:
        self.rooms: Dict[str, GameRoom] = {}
        self.room_locks: Dict[str, asyncio.Lock] = {}

    def _get_lock(self, room_id: str) -> asyncio.Lock:
        if room_id not in self.room_locks:
            self.room_locks[room_id] = asyncio.Lock()
        return self.room_locks[room_id]

    def _get_room(self, room_id: str) -> GameRoom:
        room = self.rooms.get(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found.")
        return room

    def _build_leaderboard(self, room: GameRoom) -> list[dict]:
        sorted_players = sorted(
            room.players,
            key=lambda player: (player.finished_tokens, player.name.lower()),
            reverse=True,
        )
        return [
            LeaderboardEntry(
                player_id=player.id,
                name=player.name,
                color=player.color,
                finished_tokens=player.finished_tokens,
                rank=rank,
            ).model_dump()
            for rank, player in enumerate(sorted_players, start=1)
        ]

    def serialize_room(self, room: GameRoom) -> dict:
        current_player = LudoLogic.get_player(room, room.current_turn) if room.current_turn else None
        valid_moves = []
        if room.status == "playing" and room.current_turn and room.dice_value is not None:
            valid_moves = LudoLogic.get_valid_moves(room, room.current_turn, room.dice_value)

        winner = LudoLogic.get_player(room, room.winner) if room.winner else None

        return {
            "room_id": room.room_id,
            "max_players": room.max_players,
            "status": room.status,
            "players": [player.model_dump() for player in room.players],
            "current_turn": room.current_turn,
            "current_turn_name": current_player.name if current_player else None,
            "current_turn_color": current_player.color if current_player else None,
            "dice_value": room.dice_value,
            "last_roll": room.last_roll,
            "last_move": room.last_move,
            "winner": room.winner,
            "winner_name": winner.name if winner else None,
            "valid_moves": valid_moves,
            "message": room.message,
            "leaderboard": self._build_leaderboard(room),
        }

    async def create_room(self, player_name: str, max_players: int) -> dict:
        room_id = uuid.uuid4().hex[:6].upper()
        player_id = uuid.uuid4().hex
        host = PlayerState(
            id=player_id,
            name=player_name.strip(),
            color="green",
            is_host=True,
        )
        room = GameRoom(
            room_id=room_id,
            max_players=max_players,
            players=[host],
            message=f"Room created. Waiting for {max_players - 1} more player(s).",
        )
        self.rooms[room_id] = room

        return {
            "room_id": room_id,
            "player_id": player_id,
            "player_color": host.color,
            "game_state": self.serialize_room(room),
        }

    async def join_room(self, room_id: str, player_name: str) -> dict:
        room = self._get_room(room_id)
        async with self._get_lock(room_id):
            if room.status != "waiting":
                raise HTTPException(status_code=400, detail="Game has already started.")
            if len(room.players) >= room.max_players:
                raise HTTPException(status_code=400, detail="Room is already full.")
            if any(player.name.lower() == player_name.strip().lower() for player in room.players):
                raise HTTPException(status_code=400, detail="Player name already exists in this room.")

            player_id = uuid.uuid4().hex
            color = ["green", "red", "yellow", "blue"][len(room.players)]
            player = PlayerState(id=player_id, name=player_name.strip(), color=color)
            room.players.append(player)

            remaining = room.max_players - len(room.players)
            room.message = (
                "All players joined. Host can start the game."
                if remaining == 0
                else f"Waiting for {remaining} more player(s)."
            )

            return {
                "room_id": room.room_id,
                "player_id": player_id,
                "player_color": color,
                "game_state": self.serialize_room(room),
            }

    async def start_game(self, room_id: str, player_id: str) -> dict:
        room = self._get_room(room_id)
        async with self._get_lock(room_id):
            host = room.players[0]
            if host.id != player_id:
                raise HTTPException(status_code=403, detail="Only the room host can start the game.")
            if room.status != "waiting":
                raise HTTPException(status_code=400, detail="Game has already started.")
            if len(room.players) != room.max_players:
                raise HTTPException(
                    status_code=400,
                    detail="The room must be full before the game can start.",
                )

            room.status = "playing"
            room.current_turn = room.players[0].id
            room.dice_value = None
            room.last_roll = None
            room.message = f"{room.players[0].name}'s turn to roll."
            return self.serialize_room(room)

    async def roll_dice(self, room_id: str, player_id: str) -> dict:
        room = self._get_room(room_id)
        async with self._get_lock(room_id):
            if room.status != "playing":
                raise HTTPException(status_code=400, detail="Game is not active.")
            if room.current_turn != player_id:
                raise HTTPException(status_code=403, detail="It is not your turn.")
            if room.dice_value is not None:
                raise HTTPException(status_code=400, detail="You must make a move first.")

            dice_value = random.randint(1, 6)
            room.last_roll = dice_value
            room.dice_value = dice_value

            valid_moves = LudoLogic.get_valid_moves(room, player_id, dice_value)
            current_player = LudoLogic.get_player(room, player_id)
            if not current_player:
                raise HTTPException(status_code=404, detail="Player not found in room.")

            if not valid_moves:
                room.dice_value = None
                if dice_value == 6:
                    room.message = f"{current_player.name} rolled 6 but has no valid move. Roll again."
                else:
                    next_player = self._advance_turn(room)
                    room.message = (
                        f"{current_player.name} rolled {dice_value} and has no valid moves. "
                        f"{next_player.name}'s turn."
                    )
            else:
                room.message = f"{current_player.name} rolled {dice_value}. Choose a token to move."

            return self.serialize_room(room)

    async def move_token(self, room_id: str, player_id: str, token_index: int) -> dict:
        room = self._get_room(room_id)
        async with self._get_lock(room_id):
            if room.status != "playing":
                raise HTTPException(status_code=400, detail="Game is not active.")
            if room.current_turn != player_id:
                raise HTTPException(status_code=403, detail="It is not your turn.")
            if room.dice_value is None:
                raise HTTPException(status_code=400, detail="Roll the dice before moving.")

            valid_moves = LudoLogic.get_valid_moves(room, player_id, room.dice_value)
            if token_index not in valid_moves:
                raise HTTPException(status_code=400, detail="Invalid token selection.")

            current_player = LudoLogic.get_player(room, player_id)
            if not current_player:
                raise HTTPException(status_code=404, detail="Player not found in room.")

            from_yard = current_player.tokens[token_index] < 0
            move_summary = LudoLogic.move_token(room, player_id, token_index, room.dice_value)
            dice_value = room.dice_value
            room.dice_value = None
            room.last_move = {
                "player_id": player_id,
                "token_index": token_index,
                "from_yard": from_yard,
                "captured_players": move_summary["captured_players"],
                "finished": move_summary["finished"],
                "dice_value": dice_value,
            }

            if room.status == "finished":
                room.message = f"{current_player.name} wins the game."
                return self.serialize_room(room)

            earns_extra_turn = dice_value == 6 or bool(move_summary["captured_players"]) or move_summary["finished"]
            if earns_extra_turn:
                if move_summary["finished"]:
                    room.message = f"{current_player.name} moved token {token_index + 1} to home and earned another turn."
                elif move_summary["captured_players"]:
                    captured = ", ".join(move_summary["captured_players"])
                    room.message = (
                        f"{current_player.name} moved token {token_index + 1} and captured {captured}. "
                        "Roll again."
                    )
                else:
                    room.message = f"{current_player.name} rolled 6 and earned another turn."
            else:
                next_player = self._advance_turn(room)
                room.message = f"{current_player.name} moved token {token_index + 1}. {next_player.name}'s turn."

            if move_summary["finished"] and not room.status == "finished":
                room.message = f"{room.message} Token {token_index + 1} reached home."

            return self.serialize_room(room)

    async def get_room_state(self, room_id: str) -> dict:
        room = self._get_room(room_id)
        return self.serialize_room(room)

    async def set_token_step(self, room_id: str, player_id: str, token_index: int, token_step: int) -> dict:
        room = self._get_room(room_id)
        async with self._get_lock(room_id):
            if room.status == "finished":
                raise HTTPException(status_code=400, detail="Game is already finished.")
            if token_index < 0:
                raise HTTPException(status_code=400, detail="Invalid token index.")
            if token_step < -1 or token_step > 57:
                raise HTTPException(status_code=400, detail="Invalid token step.")

            player = LudoLogic.get_player(room, player_id)
            if not player:
                raise HTTPException(status_code=404, detail="Player not found in room.")
            if token_index >= len(player.tokens):
                raise HTTPException(status_code=400, detail="Invalid token index.")

            player.tokens[token_index] = token_step
            player.finished_tokens = sum(1 for token in player.tokens if token == 57)
            room.message = f"Debug set {player.name}'s token {token_index + 1} to step {token_step}."
            room.last_move = {
                "player_id": player_id,
                "token_index": token_index,
                "from_yard": token_step < 0,
                "captured_players": [],
                "finished": token_step == 57,
                "dice_value": None,
                "debug": True,
            }
            return self.serialize_room(room)

    def mark_player_connection(self, room_id: str, player_id: str, connected: bool) -> None:
        room = self.rooms.get(room_id)
        if not room:
            return
        player = LudoLogic.get_player(room, player_id)
        if player:
            player.connected = connected

    def _advance_turn(self, room: GameRoom) -> PlayerState:
        if not room.current_turn:
            room.current_turn = room.players[0].id
            return room.players[0]

        current_index = LudoLogic.get_player_index(room, room.current_turn)
        next_index = (current_index + 1) % len(room.players)
        room.current_turn = room.players[next_index].id
        return room.players[next_index]


game_manager = GameManager()
