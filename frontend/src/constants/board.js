export const BOARD_SIZE = 15;
const STEP = 100 / BOARD_SIZE;
export const BOARD_STEP = STEP;

export const COMMON_PATH = [
  { x: 6, y: 1 }, { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 }, { x: 6, y: 5 },
  { x: 5, y: 6 }, { x: 4, y: 6 }, { x: 3, y: 6 }, { x: 2, y: 6 }, { x: 1, y: 6 },
  { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 },
  { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 }, { x: 6, y: 9 }, { x: 6, y: 10 },
  { x: 6, y: 11 }, { x: 6, y: 12 }, { x: 6, y: 13 }, { x: 6, y: 14 }, { x: 7, y: 14 },
  { x: 8, y: 14 }, { x: 8, y: 13 }, { x: 8, y: 12 }, { x: 8, y: 11 }, { x: 8, y: 10 },
  { x: 8, y: 9 }, { x: 9, y: 8 }, { x: 10, y: 8 }, { x: 11, y: 8 }, { x: 12, y: 8 },
  { x: 13, y: 8 }, { x: 14, y: 8 }, { x: 14, y: 7 }, { x: 14, y: 6 }, { x: 13, y: 6 },
  { x: 12, y: 6 }, { x: 11, y: 6 }, { x: 10, y: 6 }, { x: 9, y: 6 }, { x: 8, y: 5 },
  { x: 8, y: 4 }, { x: 8, y: 3 }, { x: 8, y: 2 }, { x: 8, y: 1 }, { x: 8, y: 0 },
  { x: 7, y: 0 }, { x: 6, y: 0 },
];

const START_OFFSETS = {
  green: 9,
  red: 48,
  yellow: 35,
  blue: 22,
};

export const HOME_PATHS = {
  green: [
    { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 },

  ],
  red: [
    { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 }, { x: 7, y: 4 }, { x: 7, y: 5 }, { x: 7, y: 6 },

  ],
  yellow: [
    { x: 13, y: 7 }, { x: 12, y: 7 }, { x: 11, y: 7 }, { x: 10, y: 7 }, { x: 9, y: 7 }, { x: 8, y: 7 },

  ],
  blue: [
    { x: 7, y: 13 }, { x: 7, y: 12 }, { x: 7, y: 11 }, { x: 7, y: 10 }, { x: 7, y: 9 }, { x: 7, y: 8 },


  ],
};

export const START_YARDS = {
  green: [
    { x: 2, y: 2 }, { x: 4, y: 2 }, { x: 2, y: 4 }, { x: 4, y: 4 },
  ],
  red: [
    { x: 10, y: 2 }, { x: 12, y: 2 }, { x: 10, y: 4 }, { x: 12, y: 4 },
  ],
  yellow: [
    { x: 10, y: 10 }, { x: 12, y: 10 }, { x: 10, y: 12 }, { x: 12, y: 12 },
  ],
  blue: [
    { x: 2, y: 10 }, { x: 4, y: 10 }, { x: 2, y: 12 }, { x: 4, y: 12 },
  ],
};

export const BASES = {
  green: { x: 0, y: 0, size: 6 },
  red: { x: 9, y: 0, size: 6 },
  blue: { x: 0, y: 9, size: 6 },
  yellow: { x: 9, y: 9, size: 6 },
};

export const SAFE_INDICES = new Set(
  Object.values(START_OFFSETS).flatMap((offset) => [offset, (offset - 8 + COMMON_PATH.length) % COMMON_PATH.length])
);
export const SAFE_CELLS = new Set(
  Array.from(SAFE_INDICES).map((index) => `${COMMON_PATH[index].x}-${COMMON_PATH[index].y}`)
);

export const START_ENTRY_CELLS = {
  green: { x: 1, y: 6 },
  red: { x: 8, y: 1 },
  yellow: { x: 13, y: 8 },
  blue: { x: 6, y: 13 },
};

export const TRACK_CELLS = COMMON_PATH.map((cell, index) => ({
  ...cell,
  id: `track-${index}`,
  kind: "track",
  safe: SAFE_INDICES.has(index),
})).filter((cell) => {
  const inCenterCross =
    cell.x >= 6 &&
    cell.x <= 8 &&
    cell.y >= 6 &&
    cell.y <= 8;

  return !inCenterCross;
});

export const HOME_CELLS = Object.entries(HOME_PATHS).flatMap(([color, cells]) =>
  cells.map((cell, index) => ({
    ...cell,
    id: `${color}-home-${index}`,
    kind: "home",
    color,
  }))
);

export function getBoardPositionStyle({ x, y, span = 1, inset = 0 }) {
  const unit = STEP;
  return {
    left: `calc(${x * unit}% + ${inset}px)`,
    top: `calc(${y * unit}% + ${inset}px)`,
    width: `calc(${span * unit}% - ${inset * 2}px)`,
    height: `calc(${span * unit}% - ${inset * 2}px)`,
  };
}

export function getBaseStyle(color) {
  const base = BASES[color];
  return getBoardPositionStyle({ x: base.x, y: base.y, span: base.size, inset: 8 });
}

export function getTokenCoordinate(color, tokenStep, tokenIndex) {
  if (tokenStep < 0) {
    return START_YARDS[color][tokenIndex];
  }
  if (tokenStep <= 51) {
    return COMMON_PATH[(START_OFFSETS[color] - tokenStep + COMMON_PATH.length) % COMMON_PATH.length];
  }
  return HOME_PATHS[color][Math.min(tokenStep - 52, HOME_PATHS[color].length - 1)];
}
