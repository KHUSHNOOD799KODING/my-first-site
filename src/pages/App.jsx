import { Routes, Route, Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import ApiTest from '../components/ApiTest';
import Weather from "./weather/weather";
import NeonSnake from "./neonsnake/neon";

// <Routes>
//   <Route path="/" element={<HomeContent />} />
//   <Route path="/weather/weather" element={<Weather />} />
// </Routes>

/*
  ADD / EDIT PROJECTS HERE.
  - path:  where the card opens (change later to your real routes)
  - accent: the glow colour of that card
  - featured: true makes the card wider
*/
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
    id: "notes",
    title: "Markdown Notes",
    blurb: "Write notes in Markdown with a live preview and search.",
    glyph: "Md",
    type: "Tool",
    status: "building",
    tags: ["React", "LocalStorage"],
    accent: "#60a5fa",
    path: "/projects/markdown-notes",
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

function ProjectCard({ project }) {
  // Moves the glow so it follows the cursor inside the card
  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    // Later: swap <a href> for <Link to> from react-router-dom
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

/* ---------- typing title + soft key sound ---------- */

const TITLE = "Projects built, By Khushnood Khan !";

let audioCtx;
function getCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  return audioCtx;
}

// A short, soft "key tick" made with the Web Audio API (no audio file needed)
function playTick() {
  const ctx = getCtx();
  if (!ctx || ctx.state !== "running") return;

  const length = Math.floor(ctx.sampleRate * 0.03);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length); // fades out fast
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800 + Math.random() * 1200; // slight variation
  filter.Q.value = 0.8;

  const gain = ctx.createGain();
  gain.gain.value = 0.12; // keep it soft

  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
}

function useTypedTitle(text, speed = 70) {
  const [shown, setShown] = useState("");
  const timer = useRef(null);

  const type = useCallback(() => {
    clearInterval(timer.current);
    const ctx = getCtx();
    if (ctx && ctx.state === "suspended") ctx.resume();

    let i = 0;
    setShown("");
    timer.current = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (text[i - 1] !== " ") playTick();
      if (i >= text.length) {
        clearInterval(timer.current);
      }
    }, speed);
  }, [text, speed]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(text);
    } else {
      type();
    }
    return () => clearInterval(timer.current);
  }, [type, text]);

  return [shown, type];
}

function HomeContent(){

   const [filter, setFilter] = useState("All");
  const [typed, replay] = useTypedTitle(TITLE);
  const isTyping = typed.length < TITLE.length;

  const types = useMemo(
    () => ["All", ...new Set(projects.map((p) => p.type))],
    []
  );

  const visible = projects.filter((p) => filter === "All" || p.type === filter);
return(
<div className="page">
      {/* <ApiTest /> */}
      <div className="ambient" aria-hidden="true" />

      <header className="hero">
        <h1
          className={`hero__title${isTyping ? " is-typing" : ""}`}
          aria-label={TITLE}
          title="Click to replay with sound"
          tabIndex={0}
          onClick={replay}
          onKeyDown={(e) => e.key === "Enter" && replay()}
        >
          {typed}
        </h1>
        <p className="hero__sub">
          A collection of things I made while learning. Pick a card to open the
          project.
        </p>

        <div className="filters" role="group" aria-label="Filter projects">
          {types.map((t) => (
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
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeContent />} />
      <Route path="/weather/weather" element={<Weather />} />
      <Route path="/neonsnake/neon" element={<NeonSnake />} />
    </Routes>
  );
}