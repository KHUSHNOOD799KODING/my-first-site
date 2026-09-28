import { useEffect, useRef } from "react";
import "./Universe.css";

const rand = (min, max) => Math.random() * (max - min) + min;
const gauss = () => Math.random() + Math.random() + Math.random() - 1.5; // roughly -1.5..1.5

/* ---------- pre-rendered sprites (drawn once, reused every frame) ---------- */

// Soft glowing dot used for every star
function makeGlowSprite(color) {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.12, color);
  grad.addColorStop(0.4, color.replace(/[\d.]+\)$/, "0.25)"));
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return c;
}

// One small spiral galaxy: bright core, hazy halo, two arms made of tiny dots
function makeGalaxy(hue) {
  const size = 240;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const mid = size / 2;

  const haze = g.createRadialGradient(mid, mid, 0, mid, mid, mid);
  haze.addColorStop(0, `hsla(${hue}, 90%, 78%, 0.6)`);
  haze.addColorStop(0.25, `hsla(${hue}, 85%, 60%, 0.22)`);
  haze.addColorStop(1, "hsla(0, 0%, 0%, 0)");
  g.fillStyle = haze;
  g.fillRect(0, 0, size, size);

  const arms = 2;
  const dots = 2600;
  for (let i = 0; i < dots; i++) {
    const t = Math.random();
    const r = Math.pow(t, 0.85) * mid * 0.92;
    const angle = t * 5.4 + ((i % arms) * Math.PI * 2) / arms;
    const spread = (1 - t * 0.55) * 9 + 1;
    const x = mid + Math.cos(angle) * r + gauss() * spread;
    const y = mid + Math.sin(angle) * r + gauss() * spread;
    const bright = 62 + (1 - t) * 30;
    g.fillStyle = `hsla(${hue + rand(-25, 25)}, 90%, ${bright}%, ${rand(0.35, 0.95)})`;
    const d = rand(0.6, 1.5);
    g.fillRect(x, y, d, d);
  }

  const core = g.createRadialGradient(mid, mid, 0, mid, mid, mid * 0.28);
  core.addColorStop(0, "rgba(255,250,235,1)");
  core.addColorStop(0.35, `hsla(${hue + 15}, 100%, 78%, 0.75)`);
  core.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = core;
  g.fillRect(0, 0, size, size);

  return c;
}

/* ---------- component ---------- */

export default function Universe() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();

    // star colours: mostly blue-white, a few warm and a few pale violet
    const palettes = [
      "rgba(190, 215, 255, 1)",
      "rgba(255, 255, 255, 1)",
      "rgba(255, 226, 190, 1)",
      "rgba(205, 190, 255, 1)",
    ];
    const sprites = palettes.map(makeGlowSprite);

    let stars = [];
    let galaxies = [];
    let shooters = [];
    let nextShooter = performance.now() + rand(2500, 5000);

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const small = w < 700;
      const starCount = Math.round(Math.min(380, (w * h) / 4200));
      stars = Array.from({ length: starCount }, () => {
        const depth = rand(0.25, 1); // far stars are smaller, dimmer and slower
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: depth * (Math.random() < 0.06 ? 2.2 : 1.1),
          depth,
          phase: rand(0, Math.PI * 2),
          speed: rand(0.6, 2.2),
          sprite: sprites[Math.floor(Math.random() * sprites.length)],
        };
      });

      // hand-picked spots so galaxies frame the page instead of clumping
      const spots = small
        ? [[0.16, 0.16], [0.86, 0.5], [0.22, 0.86]]
        : [[0.09, 0.2], [0.9, 0.14], [0.78, 0.68], [0.16, 0.76], [0.5, 0.94]];
      const hues = [268, 196, 320, 215, 285];
      galaxies = spots.map(([fx, fy], i) => ({
        x: fx * w + rand(-30, 30),
        y: fy * h + rand(-30, 30),
        size: (small ? 70 : 100) + rand(0, 55),
        tilt: rand(0.35, 0.7), // squashes the disc so it looks tilted in space
        rot: rand(0, Math.PI * 2),
        spin: rand(0.012, 0.028) * (i % 2 ? 1 : -1), // radians per second
        alpha: rand(0.65, 0.95),
        sprite: makeGalaxy(hues[i % hues.length]),
      }));
    };

    const spawnShooter = () => {
      const fromLeft = Math.random() < 0.5;
      const angle = rand(0.25, 0.55); // shallow downward slope
      const speed = rand(650, 950);
      shooters.push({
        x: fromLeft ? rand(0, w * 0.5) : rand(w * 0.5, w),
        y: rand(0, h * 0.4),
        vx: Math.cos(angle) * speed * (fromLeft ? 1 : -1),
        vy: Math.sin(angle) * speed,
        life: 0,
        max: rand(0.7, 1.1),
      });
    };

    const draw = (now, dt) => {
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      // galaxies
      for (const gx of galaxies) {
        gx.rot += gx.spin * dt;
        ctx.save();
        ctx.globalAlpha = gx.alpha;
        ctx.translate(gx.x, gx.y);
        ctx.rotate(gx.rot);
        ctx.scale(1, gx.tilt);
        ctx.drawImage(gx.sprite, -gx.size / 2, -gx.size / 2, gx.size, gx.size);
        ctx.restore();
      }

      // stars: slow sideways drift + twinkle
      for (const s of stars) {
        const x = (((s.x - t * 3 * s.depth) % w) + w) % w;
        const twinkle = 0.55 + 0.45 * Math.sin(t * s.speed + s.phase);
        const size = s.r * 7;
        ctx.globalAlpha = twinkle * (0.35 + s.depth * 0.65);
        ctx.drawImage(s.sprite, x - size / 2, s.y - size / 2, size, size);
      }

      // shooting stars
      if (!reduceMotion && now > nextShooter) {
        spawnShooter();
        nextShooter = now + rand(4500, 9000);
      }
      shooters = shooters.filter((m) => m.life < m.max);
      for (const m of shooters) {
        m.life += dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        const fade = 1 - m.life / m.max;
        const len = 0.09; // trail length in seconds of travel
        const tx = m.x - m.vx * len;
        const ty = m.y - m.vy * len;
        const trail = ctx.createLinearGradient(tx, ty, m.x, m.y);
        trail.addColorStop(0, "rgba(180, 210, 255, 0)");
        trail.addColorStop(1, `rgba(255, 255, 255, ${0.9 * fade})`);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = trail;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      draw(now, dt);
      raf = requestAnimationFrame(frame);
    };

    build();
    if (reduceMotion) {
      draw(performance.now(), 0); // one still frame
    } else {
      raf = requestAnimationFrame(frame);
    }

    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        build();
        if (reduceMotion) draw(performance.now(), 0);
      }, 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="universe" aria-hidden="true">
      <div className="universe__nebula" />
      <canvas ref={canvasRef} className="universe__canvas" />
      <div className="universe__vignette" />
    </div>
  );
}