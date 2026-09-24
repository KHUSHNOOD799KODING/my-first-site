import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import "./neon.css";

const GRID = 22; // cells per row/column
const CELL = 22; // px per cell (canvas = GRID * CELL)
const SPEED_START = 130; // ms per tick
const SPEED_MIN = 70;

const DIRS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

function randomCell(exclude) {
  let cell;
  do {
    cell = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
  } while (exclude.some((s) => s.x === cell.x && s.y === cell.y));
  return cell;
}

export default function Neon() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null); // mutable game state, avoids stale closures in the loop
  const rafRef = useRef(null);

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() =>
    Number(localStorage.getItem("neonSnakeBest") || 0)
  );
  const [status, setStatus] = useState("ready"); // ready | playing | over

  const resetGame = useCallback(() => {
    const start = { x: Math.floor(GRID / 2), y: Math.floor(GRID / 2) };
    const snake = [start, { x: start.x - 1, y: start.y }, { x: start.x - 2, y: start.y }];
    stateRef.current = {
      snake,
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: randomCell(snake),
      speed: SPEED_START,
      last: 0,
      pulse: 0,
    };
    setScore(0);
    setStatus("playing");
  }, []);

  // keyboard input
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === " ") {
        e.preventDefault();
        if (status !== "playing") resetGame();
        return;
      }
      const d = DIRS[e.key];
      if (!d || !stateRef.current) return;
      const cur = stateRef.current.dir;
      // block reversing directly into yourself
      if (d.x === -cur.x && d.y === -cur.y) return;
      stateRef.current.nextDir = d;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, resetGame]);

  // game loop
  useEffect(() => {
    if (status !== "playing") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const step = (t) => {
      const s = stateRef.current;
      if (t - s.last >= s.speed) {
        s.last = t;
        s.dir = s.nextDir;

        const head = {
          x: (s.snake[0].x + s.dir.x + GRID) % GRID,
          y: (s.snake[0].y + s.dir.y + GRID) % GRID,
        };

        // self collision
        if (s.snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
          setStatus("over");
          setBest((b) => {
            const nb = Math.max(b, s.snake.length - 3);
            localStorage.setItem("neonSnakeBest", nb);
            return nb;
          });
          return;
        }

        s.snake.unshift(head);

        if (head.x === s.food.x && head.y === s.food.y) {
          s.food = randomCell(s.snake);
          s.speed = Math.max(SPEED_MIN, s.speed - 3);
          s.pulse = 1;
          setScore((sc) => sc + 1);
        } else {
          s.snake.pop();
        }
      }

      draw(ctx, stateRef.current);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status]);

  function draw(ctx, s) {
    const size = GRID * CELL;
    ctx.clearRect(0, 0, size, size);

    // subtle grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(size, i * CELL);
      ctx.stroke();
    }

    // food
    if (s.pulse > 0) s.pulse = Math.max(0, s.pulse - 0.05);
    const pulseSize = 1 + s.pulse * 0.4;
    ctx.save();
    ctx.shadowColor = "#f472b6";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#f472b6";
    const fx = s.food.x * CELL + CELL / 2;
    const fy = s.food.y * CELL + CELL / 2;
    ctx.beginPath();
    ctx.arc(fx, fy, (CELL / 2 - 3) * pulseSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // snake
    s.snake.forEach((seg, i) => {
      const t = i / s.snake.length;
      const hue = 178 - t * 40; // cyan -> violet gradient along the body
      ctx.save();
      ctx.shadowColor = `hsl(${hue}, 90%, 60%)`;
      ctx.shadowBlur = i === 0 ? 20 : 10;
      ctx.fillStyle = `hsl(${hue}, 90%, ${i === 0 ? 65 : 55}%)`;
      const pad = i === 0 ? 1 : 2;
      ctx.beginPath();
      ctx.roundRect(
        seg.x * CELL + pad,
        seg.y * CELL + pad,
        CELL - pad * 2,
        CELL - pad * 2,
        6
      );
      ctx.fill();
      ctx.restore();
    });
  }

  return (
    <div className="neon-page">
      <div className="neon-ambient" aria-hidden="true" />

      <div className="neon-shell">
        <div className="neon-topbar">
          <Link to="/" className="neon-back">
            ← Home
          </Link>
          <h1 className="neon-title">Neon Snake</h1>
          <span className="neon-topbar-spacer" />
        </div>

        <div className="neon-scoreboard">
          <div className="neon-score">
            <span className="label">Score</span>
            <span className="value">{score}</span>
          </div>
          <div className="neon-score">
            <span className="label">Best</span>
            <span className="value">{best}</span>
          </div>
        </div>

        <div className="neon-board-wrap">
          <canvas
            ref={canvasRef}
            width={GRID * CELL}
            height={GRID * CELL}
            className="neon-canvas"
          />

          {status !== "playing" && (
            <div className="neon-overlay">
              <p className="neon-overlay-title">
                {status === "over" ? "Game Over" : "Neon Snake"}
              </p>
              {status === "over" && (
                <p className="neon-overlay-score">Score: {score}</p>
              )}
              <button className="neon-btn" onClick={resetGame}>
                {status === "over" ? "Play Again" : "Start"}
              </button>
              <p className="neon-hint">Arrow keys / WASD · Space to restart</p>
            </div>
          )}
        </div>

        {/* on-screen controls for touch devices */}
        <div className="neon-touch" aria-hidden="true">
          <button onClick={() => (stateRef.current.nextDir = DIRS.ArrowUp)}>▲</button>
          <div className="neon-touch-row">
            <button onClick={() => (stateRef.current.nextDir = DIRS.ArrowLeft)}>◀</button>
            <button onClick={() => (stateRef.current.nextDir = DIRS.ArrowDown)}>▼</button>
            <button onClick={() => (stateRef.current.nextDir = DIRS.ArrowRight)}>▶</button>
          </div>
        </div>
      </div>
    </div>
  );
}