import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import "./App.css";
import Universe from "./Universe/Universe";

/* =====================================================================
   HOW TO ADD A NEW PROJECT
   1. Make its page in src/pages (e.g. pages/quiz/Quiz.jsx)
   2. Lazy-import it in section 1 and add a <Route> in section 7
   3. Add a card in section 2 whose `path` matches that route
   ===================================================================== */

/* ---------- 1. PAGES (each loads only when its route is opened) ---------- */

const Weather = lazy(() => import("./weather/weather"));
const NeonSnake = lazy(() => import("./neonsnake/neon"));
const Calculator = lazy(() => import("./Calculator1/Calculator1"));
const Notes = lazy(() => import("./notes/Notes"));
const About = lazy(() => import("./About/About"));

/* ---------- 2. PROJECT CARDS ----------
   accent:   glow colour of the card
   featured: true makes the card wider
   type:     becomes a filter chip automatically
   status:   "live" | "building" | "idea"                                   */

const projects = [
  {
    id: "weather",
    title: "Weather Dashboard",
    blurb: "Search any city and see a 5-day forecast with live temperature charts.",
    glyph: "Wx",
    type: "Web app",
    status: "live",
    tags: ["React", "OpenWeather API", "Chart.js"],
    accent: "#22d3ee",
    path: "/weather/weather",
    featured: true,
  },
  {
    id: "snake",
    title: "Neon Snake",
    blurb: "Classic snake with a glowing trail and a saved high score.",
    glyph: "Sn",
    type: "Game",
    status: "live",
    tags: ["JavaScript", "Canvas"],
    accent: "#f472b6",
    path: "/neonsnake/neon",
  },
  {
    id: "Calculator1",
    title: "All-in-one-Calculator",
    blurb: "A glowing scientific calculator with memory, history, and keyboard support.",
    glyph: "Cx",
    type: "Tool",
    status: "live",
    tags: ["React", "JavaScript"],
    accent: "#fbbf24",
    path: "/Calculator1/Calculator1",
    featured: true,
  },
  {
    id: "notes",
    title: "Markdown Notes",
    blurb: "Write notes in Markdown with live preview and local save.",
    glyph: "Md",
    type: "Tool",
    status: "live",
    tags: ["React", "LocalStorage"],
    accent: "#60a5fa",
    path: "/notes/notes",
  },
  {
    id: "Game1",
    title: "Game Unknown",
    blurb: "Split trip costs with friends and see who owes whom.",
    glyph: "Ex",
    type: "Tool",
    status: "live",
    tags: ["React", "Node", "MongoDB"],
    accent: "#a78bfa",
    path: "/projects/expense-splitter",
  },
  {
    id: "quiz",
    title: "Quiz Maker",
    blurb: "Build multiple-choice quizzes and share them with a link.",
    glyph: "Qz",
    type: "Web app",
    status: "building",
    tags: ["MERN", "JWT"],
    accent: "#fbbf24",
    path: "/projects/quiz-maker",
  },
  {
    id: "chat",
    title: "Campus Chat",
    blurb: "Real-time chat rooms for classes and clubs.",
    glyph: "Ch",
    type: "Web app",
    status: "idea",
    tags: ["Socket.io", "Node", "React"],
    accent: "#34d399",
    path: "/projects/campus-chat",
  },
  {
    id: "memory",
    title: "Memory Match",
    blurb: "Flip cards, match pairs, beat the timer.",
    glyph: "Mm",
    type: "Game",
    status: "idea",
    tags: ["React", "CSS animation"],
    accent: "#fb7185",
    path: "/projects/memory-match",
  },
];

const STATUS_LABEL = {
  live: "Live",
  building: "In progress",
  idea: "Planned",
};

// "All" + every distinct `type` above → All / Web app / Game / Tool
const FILTER_TYPES = ["All", ...new Set(projects.map((p) => p.type))];

/* ---------- 3. ONE PROJECT CARD ---------- */

function ProjectCard({ project }) {
  // Moves the glow so it follows the cursor inside the card
  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <Link
      className={`card${project.featured ? " card--wide" : ""}`}
      to={project.path}
      onMouseMove={handleMove}
      style={{ "--accent": project.accent }}
    >
      <div className="card__top">
        <span className="card__glyph" aria-hidden="true">
          {project.glyph}
        </span>
        <span className={`status status--${project.status}`}>
          {STATUS_LABEL[project.status]}
        </span>
      </div>

      <h3 className="card__title">{project.title}</h3>
      <p className="card__blurb">{project.blurb}</p>

      <ul className="card__tags">
        {project.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
    </Link>
  );
}

/* ---------- 4. TYPING SOUND (Web Audio, no audio file needed) ---------- */

let audioCtx;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

// A short, soft "key tick": a burst of filtered noise that fades out fast
function playTick() {
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") return; // browsers block sound until a click

  const length = Math.floor(ctx.sampleRate * 0.03);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800 + Math.random() * 1200; // slight pitch variation
  filter.Q.value = 0.8;

  const gain = ctx.createGain();
  gain.gain.value = 0.12; // keep it soft

  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
}

/* ---------- 5. TYPING TITLE ---------- */

const TITLE = "Projects built, By Khushnood Khan !";

// Types `text` out letter by letter (with a tick per letter).
// Returns [textTypedSoFar, replayFunction].
function useTypewriter(text, speed = 70) {
  const [shown, setShown] = useState("");
  const timer = useRef(null);

  const type = useCallback(() => {
    clearInterval(timer.current);

    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") ctx.resume();

    let i = 0;
    setShown("");
    timer.current = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (text[i - 1] !== " ") playTick();
      if (i >= text.length) clearInterval(timer.current);
    }, speed);
  }, [text, speed]);

  // Runs on every page load; people who prefer reduced motion get the full text instantly
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setShown(text);
    } else {
      type();
    }
    return () => clearInterval(timer.current);
  }, [type, text]);

  return [shown, type];
}

function TypedTitle({ text }) {
  const [typed, replay] = useTypewriter(text);
  const isTyping = typed.length < text.length;

  return (
    <h1
      className={`hero__title${isTyping ? " is-typing" : ""}`}
      aria-label={text}
      title="Click to replay with sound"
      tabIndex={0}
      onClick={replay}
      onKeyDown={(e) => e.key === "Enter" && replay()}
    >
      {typed}
    </h1>
  );
}

/* ---------- 6. HOME PAGE ---------- */

function HomeContent() {
  const [filter, setFilter] = useState("All");
  const [universeOn, setUniverseOn] = useState(false); // space background, off by default

  const visible = projects.filter((p) => filter === "All" || p.type === filter);

  return (
    <div className="page">
      {universeOn && <Universe />}

      <header className="hero">
        <TypedTitle text={TITLE} />
        <p className="hero__sub">
          A collection of things I made while learning. Pick a card to open the
          project.
        </p>

        <div className="filters" role="group" aria-label="Filter projects">
          {FILTER_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip${filter === t ? " chip--on" : ""}`}
              aria-pressed={filter === t}
              onClick={() => setFilter(t)}
            >
              {t}
            </button>
          ))}

          <button
            type="button"
            className={`chip chip--universe${universeOn ? " chip--on" : ""}`}
            onClick={() => setUniverseOn((on) => !on)}
          >
            ✨ Universe
          </button>
          <Link className="chip chip--link" to="/about">
            👤 About me
          </Link>
        </div>
      </header>

      <main className="grid">
        {visible.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </main>

      <footer className="footer">
        {visible.length} {visible.length === 1 ? "project" : "projects"} shown
      </footer>
    </div>
  );
}

/* ---------- 7. ROUTES (URL → page) ---------- */

export default function App() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "#fff" }}>Loading…</div>}>
      <Routes>
        <Route path="/" element={<HomeContent />} />
        <Route path="/weather/weather" element={<Weather />} />
        <Route path="/neonsnake/neon" element={<NeonSnake />} />
        <Route path="/Calculator1/Calculator1" element={<Calculator />} />
        <Route path="/notes/notes" element={<Notes />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Suspense>
  );
}