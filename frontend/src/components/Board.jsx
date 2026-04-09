import {
  BASES,
  HOME_CELLS,
  SAFE_CELLS,
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

function coordKey({ x, y }) {
  return `${x}-${y}`;
}

function getTokenStyle(coordinate, stackIndex, isYard) {
  const baseStyle = getBoardPositionStyle({
    x: coordinate.x,
    y: coordinate.y,
    span: 1,
    inset: isYard ? 10 : 7,
  });
  const offset = TOKEN_STACK_OFFSETS[stackIndex] || { x: 0, y: 0 };

  return {
    ...baseStyle,
    transform: `translate(${offset.x}px, ${offset.y}px)`,
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
            const token = player
              ? {
                  playerId: player.id,
                  tokenIndex: index,
                  isClickable:
                    player.id === localPlayerId &&
                    currentTurn === localPlayerId &&
                    validMoves.includes(index) &&
                    player.tokens[index] < 0,
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
  const tokensByCell = new Map();

  players.forEach((player) => {
    player.tokens.forEach((tokenStep, tokenIndex) => {
      if (tokenStep < 0) return;

      const coordinate = getTokenCoordinate(player.color, tokenStep, tokenIndex);
      const key = coordKey(coordinate);
      const entry = {
        playerId: player.id,
        tokenIndex,
        color: player.color,
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

        {TRACK_CELLS.map((cell) => (
          <div
            key={cell.id}
            className={`path-cell track ${cell.safe ? "safe" : ""}`}
            style={getBoardPositionStyle({ x: cell.x, y: cell.y, span: 1, inset: 3 })}
          >
            {cell.safe ? <span className="safe-star">★</span> : null}
          </div>
        ))}

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
              className={`token ${token.color} ${token.isClickable ? "clickable" : ""}`}
              style={getTokenStyle({ x, y }, index, false)}
              onClick={() => token.isClickable && onMoveToken(token.tokenIndex)}
              title={`${token.color} token ${token.tokenIndex + 1}`}
            >
              {token.tokenIndex + 1}
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
