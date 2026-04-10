import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BASES,
  BOARD_STEP,
  HOME_CELLS,
  START_ENTRY_CELLS,
  START_YARDS,
  TRACK_CELLS,
  getBaseStyle,
  getBoardPositionStyle,
  getTokenCoordinate,
} from "../constants/board";
import PinMarker from "./PinMarker";

const TOKEN_STACK_OFFSETS = [
  { x: 0, y: 0 },
  { x: 12, y: 0 },
  { x: 0, y: 12 },
  { x: 12, y: 12 },
];
const STEP_ANIMATION_MS = 300;
const TURN_FRAME_MS = 110;
const SETTLE_ANIMATION_MS = 140;

function coordKey({ x, y }) {
  return `${x}-${y}`;
}

function getTokenKey(playerId, tokenIndex) {
  return `${playerId}-${tokenIndex}`;
}

const START_ENTRY_LOOKUP = Object.entries(START_ENTRY_CELLS).reduce((acc, [color, cell]) => {
  acc[coordKey(cell)] = color;
  return acc;
}, {});

function createDisplayedCoordinates(players) {
  const initial = {};

  players.forEach((player) => {
    player.tokens.forEach((tokenStep, tokenIndex) => {
      const tokenKey = getTokenKey(player.id, tokenIndex);
      initial[tokenKey] = tokenStep < 0
        ? START_YARDS[player.color][tokenIndex]
        : getTokenCoordinate(player.color, tokenStep, tokenIndex);
    });
  });

  return initial;
}

function createDisplayedSteps(players) {
  const initial = {};

  players.forEach((player) => {
    player.tokens.forEach((tokenStep, tokenIndex) => {
      const tokenKey = getTokenKey(player.id, tokenIndex);
      initial[tokenKey] = tokenStep;
    });
  });

  return initial;
}

function createTurnFrame(from, to) {
  if (!from || !to || from.x === to.x || from.y === to.y) {
    return null;
  }

  return {
    coordinate: { x: from.x, y: to.y },
    step: null,
    isTurn: true,
  };
}

function buildTokenFrames(color, tokenIndex, fromStep, toStep) {
  if (toStep < 0 || fromStep === toStep || toStep < fromStep) {
    return [];
  }

  const frames = [];

  if (fromStep < 0) {
    frames.push({
      step: -1,
      coordinate: START_YARDS[color][tokenIndex],
      duration: 0,
    });
    for (let step = 0; step <= toStep; step += 1) {
      frames.push({
        step,
        coordinate: getTokenCoordinate(color, step, tokenIndex),
        duration: STEP_ANIMATION_MS,
      });
    }
  } else {
    frames.push({
      step: fromStep,
      coordinate: getTokenCoordinate(color, fromStep, tokenIndex),
      duration: 0,
    });
    for (let step = fromStep + 1; step <= toStep; step += 1) {
      const previous = frames[frames.length - 1];
      const next = {
        step,
        coordinate: getTokenCoordinate(color, step, tokenIndex),
        duration: STEP_ANIMATION_MS,
      };

      const turnFrame = createTurnFrame(previous.coordinate, next.coordinate);
      if (turnFrame) {
        frames.push({
          ...turnFrame,
          duration: TURN_FRAME_MS,
        });
      }

      frames.push(next);
    }
  }

  return frames;
}

function getTokenStyle(coordinate, stackIndex, isYard) {
  const offset = TOKEN_STACK_OFFSETS[stackIndex] || { x: 0, y: 0 };

  if (isYard) {
    return getBoardPositionStyle({
      x: coordinate.x,
      y: coordinate.y,
      span: 1,
      inset: 10,
    });
  }

  return {
    left: `calc(${(coordinate.x + 0.5) * BOARD_STEP}% + ${offset.x}px)`,
    top: `calc(${(coordinate.y + 0.5) * BOARD_STEP}% + ${offset.y}px)`,
    transform: "translate(-50%, -50%)",
  };
}

function Base({ color, players, localPlayerId, currentTurn, validMoves, onMoveToken }) {
  const player = players.find((entry) => entry.color === color);
  const yardCells = START_YARDS[color];

  return (
    <div className={`ludo-base ${color}`} style={getBaseStyle(color)}>
      <div className="base-inner">
        <div className="base-yard">
          {yardCells.map((_, index) => {
            const token = player && player.tokens[index] < 0
              ? {
                  playerId: player.id,
                  tokenIndex: index,
                  isClickable:
                    player.id === localPlayerId &&
                    currentTurn === localPlayerId &&
                    validMoves.includes(index),
                }
              : null;

            return (
              <div key={`${color}-yard-${index}`} className="yard-slot">
                {token ? (
                  <button
                    type="button"
                    className={`token yard-token ${color} ${token.isClickable ? "clickable" : ""}`}
                    onClick={() => token.isClickable && onMoveToken(index)}
                    title={`${color} token ${index + 1}`}
                  >
                    <PinMarker className="yard-marker" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Board({ players, currentTurn, localPlayerId, validMoves, onMoveToken }) {
  const [displayedCoordinates, setDisplayedCoordinates] = useState(() => createDisplayedCoordinates(players));
  const [displayedSteps, setDisplayedSteps] = useState(() => createDisplayedSteps(players));
  const displayedCoordinatesRef = useRef(displayedCoordinates);
  const displayedStepsRef = useRef(displayedSteps);
  const animationTimeoutsRef = useRef(new Map());
  const tokensByCell = new Map();

  useEffect(() => {
    displayedCoordinatesRef.current = displayedCoordinates;
  }, [displayedCoordinates]);

  useEffect(() => {
    displayedStepsRef.current = displayedSteps;
  }, [displayedSteps]);

  useLayoutEffect(() => {
    players.forEach((player) => {
      player.tokens.forEach((tokenStep, tokenIndex) => {
        const tokenKey = getTokenKey(player.id, tokenIndex);
        const existingTimeouts = animationTimeoutsRef.current.get(tokenKey);

        if (existingTimeouts) {
          existingTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
          animationTimeoutsRef.current.delete(tokenKey);
        }

        const previousStep = displayedStepsRef.current[tokenKey] ?? tokenStep;

        if (tokenStep < previousStep) {
          setDisplayedCoordinates((current) => ({
            ...current,
            [tokenKey]: tokenStep < 0
              ? START_YARDS[player.color][tokenIndex]
              : getTokenCoordinate(player.color, tokenStep, tokenIndex),
          }));
          setDisplayedSteps((current) => ({
            ...current,
            [tokenKey]: tokenStep,
          }));
          return;
        }

        const frames = buildTokenFrames(player.color, tokenIndex, previousStep, tokenStep);

        if (frames.length <= 1) {
          setDisplayedCoordinates((current) => ({
            ...current,
            [tokenKey]: tokenStep < 0
              ? START_YARDS[player.color][tokenIndex]
              : getTokenCoordinate(player.color, tokenStep, tokenIndex),
          }));
          setDisplayedSteps((current) => ({
            ...current,
            [tokenKey]: tokenStep,
          }));
          return;
        }

        setDisplayedCoordinates((current) => ({
          ...current,
          [tokenKey]: frames[0].coordinate,
        }));
        setDisplayedSteps((current) => ({
          ...current,
          [tokenKey]: frames[0].step,
        }));

        let elapsed = 0;
        const timeoutIds = frames.slice(1).map((frame) => {
          elapsed += frame.duration ?? STEP_ANIMATION_MS;
          return window.setTimeout(() => {
            setDisplayedCoordinates((current) => ({
              ...current,
              [tokenKey]: frame.coordinate,
            }));
            if (frame.step !== null) {
              setDisplayedSteps((current) => ({
                ...current,
                [tokenKey]: frame.step,
              }));
            }
          }, elapsed);
        });

        timeoutIds.push(
          window.setTimeout(() => {
            animationTimeoutsRef.current.delete(tokenKey);
            setDisplayedSteps((current) => ({
              ...current,
              [tokenKey]: tokenStep,
            }));
          }, elapsed + SETTLE_ANIMATION_MS)
        );

        animationTimeoutsRef.current.set(tokenKey, timeoutIds);
      });
    });
  }, [players]);

  useLayoutEffect(() => () => {
    animationTimeoutsRef.current.forEach((timeoutIds) => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    });
    animationTimeoutsRef.current.clear();
  }, []);

  players.forEach((player) => {
    player.tokens.forEach((tokenStep, tokenIndex) => {
      if (tokenStep < 0) return;

      const tokenKey = getTokenKey(player.id, tokenIndex);
      const coordinate =
        displayedCoordinates[tokenKey] ??
        getTokenCoordinate(player.color, tokenStep, tokenIndex);
      const key = coordKey(coordinate);
      const entry = {
        playerId: player.id,
        tokenIndex,
        color: player.color,
        isMoving: Boolean(animationTimeoutsRef.current.get(tokenKey)),
        isClickable:
          player.id === localPlayerId &&
          currentTurn === localPlayerId &&
          validMoves.includes(tokenIndex),
      };

      if (!tokensByCell.has(key)) {
        tokensByCell.set(key, []);
      }
      tokensByCell.get(key).push(entry);
    });
  });

  return (
    <section className="board-shell">
      <div className="ludo-board-real">
        {Object.keys(BASES).map((color) => (
          <Base
            key={color}
            color={color}
            players={players}
            localPlayerId={localPlayerId}
            currentTurn={currentTurn}
            validMoves={validMoves}
            onMoveToken={onMoveToken}
          />
        ))}

        <div className="board-center">
          <div className="triangle green" />
          <div className="triangle red" />
          <div className="triangle yellow" />
          <div className="triangle blue" />
        </div>

        {TRACK_CELLS.map((cell) => {
          const startColor = START_ENTRY_LOOKUP[coordKey(cell)];

          return (
            <div
              key={cell.id}
              className={`path-cell track ${cell.safe ? "safe" : ""} ${startColor ? `start-entry ${startColor}` : ""}`}
              style={getBoardPositionStyle({ x: cell.x, y: cell.y, span: 1, inset: 3 })}
            >
              {!startColor && cell.safe ? <span className="safe-star">{"\u2606"}</span> : null}
            </div>
          );
        })}

        {HOME_CELLS.map((cell) => (
          <div
            key={cell.id}
            className={`path-cell home ${cell.color}`}
            style={getBoardPositionStyle({ x: cell.x, y: cell.y, span: 1, inset: 3 })}
          />
        ))}

        {Array.from(tokensByCell.entries()).flatMap(([key, tokens]) => {
          const [x, y] = key.split("-").map(Number);
          return tokens.map((token, index) => (
            <button
              key={`${token.playerId}-${token.tokenIndex}`}
              type="button"
              className={`token ${token.color} ${token.isClickable ? "clickable" : ""} ${token.isMoving ? "moving" : ""}`}
              style={getTokenStyle({ x, y }, index, false)}
              onClick={() => token.isClickable && onMoveToken(token.tokenIndex)}
              title={`${token.color} token ${token.tokenIndex + 1}`}
            >
              <PinMarker className="token-marker" />
            </button>
          ));
        })}
      </div>

      <div className="board-legend">
        <div><span className="legend-chip safe" /> Safe star</div>
        <div><span className="legend-chip move" /> Valid token</div>
        <div><span className="legend-chip turn" /> Your turn token</div>
      </div>
    </section>
  );
}
