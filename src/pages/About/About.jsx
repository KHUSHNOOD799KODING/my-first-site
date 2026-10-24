import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./About.css";

/* =====================================================================
   EDIT YOUR DETAILS HERE — everything on the page comes from these lists
   ===================================================================== */

const PROFILE = {
  name: "Khushnood Khan",
  role: "Full-stack web developer in the making",
  tagline: "I build small, glowing things with React and Node — and ship them live.",
  about: [
    "I'm a college student who learns by building. Instead of only reading tutorials, I turn what I learn into small projects — a weather dashboard, a neon snake game, a scientific calculator and a markdown notes app.",
    "I like the whole journey: designing the interface, wiring up the backend, and shipping it live on Azure so anyone can open it.",
  ],
  email: "you@example.com", // ← put your real email
  links: [
    { label: "GitHub", href: "https://github.com/KHUSHNOOD799KODING" }, // ← your GitHub
    { label: "LinkedIn", href: "https://www.linkedin.com/in/khushnood-k-92bb00228/" }, // ← your LinkedIn
    { label: "Live site", href: "https://www.khushnoodkhan.me" },
  ],
};

// Real brand logos, loaded from the devicon CDN (pinned version).
// `invert` is for logos that are black and would vanish on the dark background.
const ICON_BASE = "https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons";

const SKILLS = [
  { name: "React", icon: "react/react-original", note: "Hooks, routing, lazy-loaded pages", accent: "#22d3ee" },
  { name: "Vite", icon: "vitejs/vitejs-original", note: "Fast dev server and production builds", accent: "#a78bfa" },
  { name: "JavaScript", icon: "javascript/javascript-original", note: "Canvas games, Web Audio, clean logic", accent: "#fbbf24" },
  { name: "Node.js", icon: "nodejs/nodejs-original", note: "Backend runtime on Azure App Service", accent: "#34d399" },
  { name: "Express", icon: "express/express-original", invert: true, note: "REST API with CORS and routes", accent: "#e5e7eb" },
  { name: "MongoDB", icon: "mongodb/mongodb-original", note: "Cloud database on Atlas", accent: "#4ade80" },
  { name: "Azure", icon: "azure/azure-original", note: "Static Web Apps and App Service", accent: "#60a5fa" },
  { name: "GitHub Actions", icon: "githubactions/githubactions-original", note: "Auto-deploy on every push", accent: "#f472b6" },
  { name: "CSS", icon: "css3/css3-original", note: "Glow effects, animation, responsive layouts", accent: "#38bdf8" },
  { name: "HTML", icon: "html5/html5-original", note: "Semantic, accessible markup", accent: "#fb923c" },
];

// Logo image; if the CDN is unreachable it falls back to the first two letters
function SkillIcon({ skill }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="ab-icon-fallback">{skill.name.slice(0, 2)}</span>;
  return (
    <img
      className={`ab-icon${skill.invert ? " ab-icon--invert" : ""}`}
      src={`${ICON_BASE}/${skill.icon}.svg`}
      alt=""
      loading="lazy"
      draggable="false"
      onError={() => setFailed(true)}
    />
  );
}

// Cards that open your other project pages (paths match the routes in App.jsx)
const FEATURED = [
  { title: "Weather Dashboard", glyph: "Wx", blurb: "Live conditions with rain, snow, sun and night skies.", accent: "#22d3ee", path: "/weather/weather" },
  { title: "Neon Snake", glyph: "Sn", blurb: "Glowing canvas snake with a saved high score.", accent: "#f472b6", path: "/neonsnake/neon" },
  { title: "All-in-one Calculator", glyph: "Cx", blurb: "Scientific mode, unit converter and live currency.", accent: "#fbbf24", path: "/Calculator1/Calculator1" },
  { title: "Markdown Notes", glyph: "Md", blurb: "Notes with live preview, saved in your browser.", accent: "#60a5fa", path: "/notes/notes" },
];

const SHIPPED = [
  { title: "A project hub in React + Vite", text: "Glowing cards, lazy-loaded pages and a typing title — one home for every small project." },
  { title: "Live on Azure with my own domain", text: "Frontend on Azure Static Web Apps, served from khushnoodkhan.me." },
  { title: "Express API + MongoDB Atlas", text: "A Node API on Azure App Service connected to a cloud database." },
  { title: "Push to deploy", text: "GitHub Actions builds and ships the site on every git push." },
];

/* =====================================================================
   SMALL REUSABLE PIECES
   ===================================================================== */

// A card that tilts toward the cursor and shows a moving glare.
// It writes straight to CSS variables (no React re-render), so it stays cheap.
function TiltCard({ enabled, className = "", style, children }) {
  const ref = useRef(null);

  const onMove = (e) => {
    if (!enabled || e.pointerType !== "mouse") return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width; // 0 → 1 across the card
    const y = (e.clientY - r.top) / r.height; // 0 → 1 down the card
    el.style.setProperty("--rx", `${(0.5 - y) * 14}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 18}deg`);
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
  };

  const onLeave = () => {
    ref.current.style.setProperty("--rx", "0deg");
    ref.current.style.setProperty("--ry", "0deg");
  };

  return (
    <div
      ref={ref}
      className={`ab-tilt ${className}`}
      style={style}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="ab-tilt__in">{children}</div>
    </div>
  );
}

// Wraps a button so it gently follows the cursor when the cursor is near it
function Magnet({ enabled, children }) {
  const wrap = useRef(null);
  const inner = useRef(null);

  const onMove = (e) => {
    if (!enabled || e.pointerType !== "mouse") return;
    const r = wrap.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    inner.current.style.transform = `translate(${dx * 0.25}px, ${dy * 0.35}px)`;
  };

  const onLeave = () => {
    inner.current.style.transform = "";
  };

  return (
    <span ref={wrap} className="ab-magnet" onPointerMove={onMove} onPointerLeave={onLeave}>
      <span ref={inner} className="ab-magnet__in">
        {children}
      </span>
    </span>
  );
}

/* =====================================================================
   THE PAGE
   ===================================================================== */

export default function About() {
  // "3D Motion" switch. Starts off for people who asked their device to reduce motion.
  const [motion, setMotion] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const rootRef = useRef(null);
  const heroRef = useRef(null); // gets --px / --py (cursor position) for the name parallax
  const fxRef = useRef(null); //   gets --px / --py / --scroll for the 3D cube
  const spotRef = useRef(null); // the soft light that follows the cursor
  const barRef = useRef(null); //  scroll progress bar

  // 1. Reveal sections with a 3D flip-in as they scroll into view
  useEffect(() => {
    const items = rootRef.current.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // 2. Scroll progress → progress bar + cube rotation (one update per frame)
  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      if (fxRef.current) fxRef.current.style.setProperty("--scroll", p.toFixed(4));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // 3. Cursor → light spot, name parallax and cube tilt (mouse devices only)
  useEffect(() => {
    if (!motion || !window.matchMedia("(hover: hover)").matches) return;

    let raf = 0;
    let x = 0;
    let y = 0;

    const apply = () => {
      raf = 0;
      const nx = (x / window.innerWidth - 0.5) * 2; // -1 → 1
      const ny = (y / window.innerHeight - 0.5) * 2;
      if (spotRef.current) spotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      [heroRef.current, fxRef.current].forEach((el) => {
        if (!el) return;
        el.style.setProperty("--px", nx.toFixed(3));
        el.style.setProperty("--py", ny.toFixed(3));
      });
    };

    const onMove = (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [motion]);

  const goTo = (id) =>
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: motion ? "smooth" : "auto", block: "start" });

  return (
    <div ref={rootRef} className={`ab-page${motion ? "" : " ab-off"}`}>
      {/* ---------- background layers ---------- */}
      <div className="ab-bg" aria-hidden="true" />
      <div className="ab-bar" ref={barRef} aria-hidden="true" />
      <div className="ab-spot" ref={spotRef} aria-hidden="true" />

      {/* 3D skills ring: centred, turns with scroll, tilts with the cursor */}
      <div className="ab-fx" ref={fxRef} aria-hidden="true">
        <div className="ab-ring">
          {SKILLS.map((s, i) => (
            <div key={s.name} className="ab-face" style={{ "--i": i, "--accent": s.accent }}>
              <SkillIcon skill={s} />
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- top bar ---------- */}
      <nav className="ab-topbar">
        <Link to="/" className="ab-back">
          ← Home
        </Link>
        <button
          type="button"
          className={`ab-pill${motion ? " ab-pill--on" : ""}`}
          aria-pressed={motion}
          onClick={() => setMotion((m) => !m)}
        >
          3D Motion
        </button>
      </nav>

      <main className="ab-main">
        {/* ---------- hero ---------- */}
        <header className="ab-hero" ref={heroRef}>
          <p className="ab-eyebrow">Hello, I'm</p>

          <h1 className="ab-name" data-text={PROFILE.name} aria-label={PROFILE.name}>
            {PROFILE.name.split(" ").map((word, w) => (
              <Fragment key={w}>
                {w > 0 && " "}
                <span className="ab-word">
                  {[...word].map((ch, i) => (
                    <span key={i} className="ab-letter" aria-hidden="true">
                      {ch}
                    </span>
                  ))}
                </span>
              </Fragment>
            ))}
          </h1>

          <p className="ab-role">{PROFILE.role}</p>
          <p className="ab-tagline">{PROFILE.tagline}</p>

          <div className="ab-actions">
            <button type="button" className="ab-btn ab-btn--primary" onClick={() => goTo("work")}>
              See my work
            </button>
            <button type="button" className="ab-btn" onClick={() => goTo("contact")}>
              Get in touch
            </button>
          </div>

          <p className="ab-scrollhint">Scroll ↓</p>
        </header>

        {/* ---------- about ---------- */}
        <section className="ab-section" id="about">
          <h2 className="ab-h2" data-reveal>
            <span className="ab-kicker">01</span> About me
          </h2>

          <div className="ab-about">
            <div data-reveal>
              {PROFILE.about.map((text, i) => (
                <p key={i} className="ab-text">
                  {text}
                </p>
              ))}
            </div>

            <div className="ab-stats">
              {[
                { n: FEATURED.length, l: "Live projects" },
                { n: SKILLS.length, l: "Tools in my stack" },
                { n: "CI/CD", l: "Auto-deploys on push" },
              ].map((s, i) => (
                <div key={s.l} data-reveal style={{ "--d": i }}>
                  <TiltCard enabled={motion} className="ab-stat">
                    <span className="ab-stat__n">{s.n}</span>
                    <span className="ab-stat__l">{s.l}</span>
                  </TiltCard>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- skills ---------- */}
        <section className="ab-section" id="skills">
          <h2 className="ab-h2" data-reveal>
            <span className="ab-kicker">02</span> What I work with
          </h2>

          <div className="ab-grid ab-grid--skills">
            {SKILLS.map((s, i) => (
              <div key={s.name} data-reveal style={{ "--d": i % 4 }}>
                <TiltCard enabled={motion} style={{ "--accent": s.accent }}>
                  <span className="ab-glyph"><SkillIcon skill={s} /></span>
                  <h3 className="ab-h3">{s.name}</h3>
                  <p className="ab-note">{s.note}</p>
                </TiltCard>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- work ---------- */}
        <section className="ab-section" id="work">
          <h2 className="ab-h2" data-reveal>
            <span className="ab-kicker">03</span> Things I've built
          </h2>

          <div className="ab-grid ab-grid--work">
            {FEATURED.map((p, i) => (
              <div key={p.title} data-reveal style={{ "--d": i }}>
                <TiltCard enabled={motion} style={{ "--accent": p.accent }}>
                  <Link to={p.path} className="ab-project">
                    <span className="ab-glyph">{p.glyph}</span>
                    <h3 className="ab-h3">{p.title}</h3>
                    <p className="ab-note">{p.blurb}</p>
                    <span className="ab-open">Open →</span>
                  </Link>
                </TiltCard>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- journey ---------- */}
        <section className="ab-section" id="journey">
          <h2 className="ab-h2" data-reveal>
            <span className="ab-kicker">04</span> What I've shipped
          </h2>

          <ol className="ab-timeline">
            {SHIPPED.map((s, i) => (
              <li key={s.title} className="ab-step" data-reveal style={{ "--d": i }}>
                <h3 className="ab-h3">{s.title}</h3>
                <p className="ab-note">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- contact ---------- */}
        <section className="ab-section ab-contact" id="contact">
          <h2 className="ab-h2 ab-h2--center" data-reveal>
            <span className="ab-kicker">05</span> Let's build something
          </h2>
          <p className="ab-text ab-text--center" data-reveal>
            Have an idea, a question, or just want to say hi? My inbox is open.
          </p>

          <div data-reveal>
            <Magnet enabled={motion}>
              {/* <a className="ab-btn ab-btn--primary ab-btn--big" href={`mailto:${PROFILE.email}`}>
                Say hello ✉
              </a> */}
            </Magnet>
          </div>

          <div className="ab-links" data-reveal>
            {PROFILE.links.map((l) => (
              <a key={l.label} className="ab-btn" href={l.href} target="_blank" rel="noopener noreferrer">
                {l.label} ↗
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer className="ab-footer">
        Built with React · Hosted on Azure · © {new Date().getFullYear()} {PROFILE.name}
      </footer>
    </div>
  );
}