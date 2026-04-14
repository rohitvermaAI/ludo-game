import { useEffect, useRef, useState } from "react";
import Board from "../components/Board";
import Dice from "../components/Dice";
import Leaderboard from "../components/Leaderboard";
import RoomSetup from "../components/RoomSetup";
import WaitingRoom from "../components/WaitingRoom";
import { api } from "../services/api";
import { connectToRoom } from "../services/socket";
import { playSoundEffect } from "../services/sfx";

export default function GamePage() {
  const [session, setSession] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const autoMoveRef = useRef("");
  const soundRef = useRef("");

  useEffect(() => {
    if (!session?.roomId || !session?.playerId) {
      return undefined;
    }

    const socket = connectToRoom(session.roomId, session.playerId, setGameState);
    socketRef.current = socket;

    const keepAlive = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send("ping");
      }
    }, 15000);

    return () => {
      window.clearInterval(keepAlive);
      socket.close();
    };
  }, [session]);

  const setSessionFromResponse = (response) => {
    setSession({
      roomId: response.room_id,
      playerId: response.player_id,
      playerColor: response.player_color,
    });
    setGameState(response.game_state);
  };

  const handleCreateRoom = async (payload) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.createRoom(payload);
      setSessionFromResponse(response);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (payload) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.joinRoom(payload);
      setSessionFromResponse(response);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.startGame({
        room_id: session.roomId,
        player_id: session.playerId,
      });
      setGameState(response);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRollDice = async () => {
    if (!session) return;
    setRolling(true);
    setError("");
    try {
      const response = await api.rollDice({
        room_id: session.roomId,
        player_id: session.playerId,
      });
      setGameState(response);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      window.setTimeout(() => setRolling(false), 1200);
    }
  };

  const handleMoveToken = async (tokenIndex) => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.moveToken({
        room_id: session.roomId,
        player_id: session.playerId,
        token_index: tokenIndex,
      });
      setGameState(response);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!gameState?.last_move) {
      return;
    }

    const move = gameState.last_move;
    const signature = [
      gameState.room_id,
      move.player_id,
      move.token_index,
      move.dice_value,
      move.from_yard ? "yard" : "path",
      (move.captured_players || []).join(","),
      move.finished ? "finished" : "moving",
      gameState.status,
      gameState.winner || "",
    ].join("|");

    if (soundRef.current === signature) {
      return;
    }

    soundRef.current = signature;

    if (move.from_yard) {
      playSoundEffect("tokenOut");
    }

    if (move.captured_players?.length) {
      playSoundEffect("tokenCut");
    }

    if (move.finished || gameState.status === "finished") {
      playSoundEffect("gameWin");
    }
  }, [gameState]);

  useEffect(() => {
    if (!session?.playerId || !gameState) {
      return;
    }

    const shouldAutoMove =
      gameState.status === "playing" &&
      gameState.current_turn === session.playerId &&
      gameState.dice_value !== null &&
      Array.isArray(gameState.valid_moves) &&
      gameState.valid_moves.length === 1 &&
      !loading &&
      !rolling;

    if (!shouldAutoMove) {
      autoMoveRef.current = "";
      return;
    }

    const tokenIndex = gameState.valid_moves[0];
    const signature = `${gameState.room_id}:${gameState.current_turn}:${gameState.dice_value}:${tokenIndex}`;
    if (autoMoveRef.current === signature) {
      return;
    }

    autoMoveRef.current = signature;
    handleMoveToken(tokenIndex);
  }, [gameState, loading, rolling, session?.playerId]);

  if (!session || !gameState) {
    return (
      <RoomSetup
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        loading={loading}
        error={error}
      />
    );
  }

  if (gameState.status === "waiting") {
    return (
      <main className="app-shell">
        <WaitingRoom
          roomId={session.roomId}
          gameState={gameState}
          playerId={session.playerId}
          onStart={handleStartGame}
          loading={loading}
        />
        {error ? <p className="error-banner">{error}</p> : null}
      </main>
    );
  }

  const isMyTurn = gameState.current_turn === session.playerId;
  const canRoll = isMyTurn && gameState.dice_value === null && gameState.status === "playing";
  const currentTurnPlayer = gameState.players.find((player) => player.id === gameState.current_turn);
  const activeColor = currentTurnPlayer?.color;

  return (
    <main className="app-shell game-screen">
      <section className="game-chrome">
        <section className="board-stage">
          <Board
            players={gameState.players}
            currentTurn={gameState.current_turn}
            localPlayerId={session.playerId}
            validMoves={gameState.valid_moves}
            onMoveToken={handleMoveToken}
            activeColor={activeColor}
          />

          <Dice
            value={gameState.dice_value ?? gameState.last_roll}
            isRolling={rolling}
            canRoll={canRoll}
            onRoll={handleRollDice}
          />
        </section>
      </section>

      {gameState.status === "finished" ? (
        <Leaderboard
          leaderboard={gameState.leaderboard}
          winnerName={gameState.winner_name}
        />
      ) : null}

      {error ? <p className="error-banner">{error}</p> : null}
    </main>
  );
}
