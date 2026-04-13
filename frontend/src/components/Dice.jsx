import { useEffect, useState } from "react";

const DOT_LAYOUTS = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

export default function Dice({ value, isRolling, canRoll, onRoll }) {
  const [displayValue, setDisplayValue] = useState(value || 1);
  const [spinStyle, setSpinStyle] = useState({
    transform: "rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)",
  });

  useEffect(() => {
    if (!isRolling) {
      setDisplayValue(value || 1);
      setSpinStyle({
        transform: "rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)",
      });
      return undefined;
    }

    const interval = window.setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
      const rotateX = 360 + Math.floor(Math.random() * 540);
      const rotateY = 360 + Math.floor(Math.random() * 540);
      const rotateZ = Math.floor(Math.random() * 40) - 20;

      setSpinStyle({
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(1.06)`,
      });
    }, 55);

    return () => window.clearInterval(interval);
  }, [isRolling, value]);

  return (
    <div className={`dice-fab ${canRoll ? "ready" : ""} ${isRolling ? "is-rolling" : ""}`}>
      <button
        type="button"
        className={`dice-button ${canRoll && !isRolling ? "clickable" : ""}`}
        onClick={() => {
          if (canRoll && !isRolling) {
            onRoll();
          }
        }}
        disabled={!canRoll || isRolling}
        aria-label={isRolling ? "Rolling dice" : "Roll dice"}
      >
        <div className={`dice ${isRolling ? "rolling" : ""}`} style={spinStyle}>
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              key={index}
              className={`pip ${DOT_LAYOUTS[displayValue]?.includes(index + 1) ? "visible" : ""}`}
            />
          ))}
        </div>
      </button>
    </div>
  );
}
