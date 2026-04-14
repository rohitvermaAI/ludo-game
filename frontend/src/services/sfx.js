const SOUND_PATHS = {
  tokenOut: "/sounds/token-out.mp3",
  tokenCut: "/sounds/token-cut.mp3",
  gameWin: "/sounds/game-win.mp3",
};

const cache = new Map();

function getAudio(src) {
  if (!cache.has(src)) {
    cache.set(src, new Audio(src));
  }
  const audio = cache.get(src);
  audio.currentTime = 0;
  return audio;
}

export function playSoundEffect(name) {
  const src = SOUND_PATHS[name];
  if (!src) return;

  const audio = getAudio(src);
  audio.play().catch(() => {
    // Ignore autoplay restrictions.
  });
}
