from __future__ import annotations

from typing import List, Optional

from game_logic.constants import (
    BOARD_TRACK_STEPS,
    FINAL_STEP,
    SAFE_POSITIONS,
    START_OFFSETS,
    START_YARD,
)
from models.schemas import GameRoom, PlayerState


class LudoLogic:
    @staticmethod
    def get_player(room: GameRoom, player_id: str) -> Optional[PlayerState]:
        return next((player for player in room.players if player.id == player_id), None)

    @staticmethod
    def get_player_index(room: GameRoom, player_id: str) -> int:
        for index, player in enumerate(room.players):
            if player.id == player_id:
                return index
        return -1

    @staticmethod
    def get_absolute_position(color: str, token_step: int) -> Optional[int]:
        if token_step < 0 or token_step >= BOARD_TRACK_STEPS:
            return None
        return (START_OFFSETS[color] + token_step) % BOARD_TRACK_STEPS

    @staticmethod
    def can_token_move(token_step: int, dice_value: int) -> bool:
        if token_step == START_YARD:
            return dice_value == 6
        return token_step + dice_value <= FINAL_STEP

    @classmethod
    def get_valid_moves(cls, room: GameRoom, player_id: str, dice_value: int) -> List[int]:
        player = cls.get_player(room, player_id)
        if not player:
            return []

        valid_moves: List[int] = []
        for token_index, token_step in enumerate(player.tokens):
            if cls.can_token_move(token_step, dice_value):
                valid_moves.append(token_index)
        return valid_moves

    @classmethod
    def move_token(
        cls,
        room: GameRoom,
        player_id: str,
        token_index: int,
        dice_value: int,
    ) -> dict:
        player = cls.get_player(room, player_id)
        if not player:
            raise ValueError("Player not found in room.")

        if token_index < 0 or token_index >= len(player.tokens):
            raise ValueError("Invalid token index.")

        old_step = player.tokens[token_index]
        if not cls.can_token_move(old_step, dice_value):
            raise ValueError("That token cannot move with the current dice roll.")

        new_step = 0 if old_step == START_YARD else old_step + dice_value
        player.tokens[token_index] = new_step
        player.finished_tokens = sum(1 for token in player.tokens if token == FINAL_STEP)

        move_summary = {
            "captured_players": [],
            "finished": new_step == FINAL_STEP,
        }

        absolute_position = cls.get_absolute_position(player.color, new_step)
        if absolute_position is not None and absolute_position not in SAFE_POSITIONS:
            for opponent in room.players:
                if opponent.id == player.id:
                    continue
                for opponent_index, opponent_step in enumerate(opponent.tokens):
                    if cls.get_absolute_position(opponent.color, opponent_step) == absolute_position:
                        opponent.tokens[opponent_index] = START_YARD
                        opponent.finished_tokens = sum(
                            1 for token in opponent.tokens if token == FINAL_STEP
                        )
                        move_summary["captured_players"].append(opponent.name)

        if player.finished_tokens == len(player.tokens):
            room.winner = player.id
            room.status = "finished"

        return move_summary
