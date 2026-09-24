import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Weather.css";

// Put your key in a .env file as VITE_WEATHER_API_KEY (OpenWeatherMap)
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

// Maps OpenWeatherMap's "main" condition to a background mood + emoji
const CONDITION_MAP = {
  Clear: { mood: "sunny", icon: "☀️" },
  Clouds: { mood: "cloudy", icon: "☁️" },
  Rain: { mood: "rainy", icon: "🌧️" },
  Drizzle: { mood: "rainy", icon: "🌦️" },
  Thunderstorm: { mood: "stormy", icon: "⛈️" },
  Snow: { mood: "snowy", icon: "❄️" },
  Mist: { mood: "cloudy", icon: "🌫️" },
  Haze: { mood: "cloudy", icon: "🌫️" },
};

function getCondition(main) {
  return CONDITION_MAP[main] || { mood: "cloudy", icon: "🌤️" };
}

// Builds an array of randomized raindrops/snowflakes so each one falls
// at a slightly different speed, angle and delay — looks natural instead
// of a robotic grid.
function useParticles(count, seedKey) {
  return useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${seedKey}-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 0.7 + Math.random() * 0.9,
      drift: Math.random() * 40 - 20,
    }));
  }, [count, seedKey]);
}

function RainLayer({ heavy }) {
  const drops = useParticles(heavy ? 90 : 50, "rain");
  return (
    <div className="fx-rain" aria-hidden="true">
      {drops.map((d) => (
        <span
          key={d.id}
          className="drop"
          style={{
            left: `${d.left}%`,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function SnowLayer() {
  const flakes = useParticles(60, "snow");
  return (
    <div className="fx-snow" aria-hidden="true">
      {flakes.map((f) => (
        <span
          key={f.id}
          className="flake"
          style={{
            left: `${f.left}%`,
            animationDelay: `${f.delay}s`,
            animationDuration: `${3 + f.duration * 3}s`,
            "--drift": `${f.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

function SunLayer() {
  return (
    <div className="fx-sun" aria-hidden="true">
      <div className="sun-core" />
      <div className="sun-rays" />
    </div>
  );
}

function CloudLayer({ dense }) {
  const puffs = dense ? [10, 40, 65, 85] : [15, 55];
  return (
    <div className="fx-clouds" aria-hidden="true">
      {puffs.map((top, i) => (
        <div
          key={i}
          className="cloud"
          style={{ top: `${top * 0.6 + 5}%`, animationDelay: `${i * -6}s` }}
        />
      ))}
    </div>
  );
}

function BoltLayer() {
  return (
    <div className="fx-bolt" aria-hidden="true">
      <div className="bolt-flash" />
    </div>
  );
}

// Windy conditions (fast wind) get streaking lines across the screen
function WindLayer() {
  const lines = useParticles(14, "wind");
  return (
    <div className="fx-wind" aria-hidden="true">
      {lines.map((l) => (
        <span
          key={l.id}
          className="wind-line"
          style={{
            top: `${l.left}%`,
            animationDelay: `${l.delay * 0.5}s`,
            animationDuration: `${0.9 + l.duration * 0.6}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function Weather() {
  const [city, setCity] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;

    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          city
        )}&units=metric&appid=${API_KEY}`
      );
      if (!res.ok) throw new Error("City not found");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const condition = data ? getCondition(data.weather[0].main) : null;
  const windSpeed = data ? data.wind.speed : 0;
  const isWindy = windSpeed >= 8; // m/s — noticeably fast wind

  return (
    <div className={`weather-page${condition ? ` mood-${condition.mood}` : ""}`}>
      {/* ---- animated background layers ---- */}
      <div className="fx-ambient" aria-hidden="true" />
      {condition?.mood === "sunny" && <SunLayer />}
      {condition?.mood === "cloudy" && <CloudLayer />}
      {condition?.mood === "rainy" && (
        <>
          <CloudLayer dense />
          <RainLayer />
        </>
      )}
      {condition?.mood === "stormy" && (
        <>
          <CloudLayer dense />
          <RainLayer heavy />
          <BoltLayer />
        </>
      )}
      {condition?.mood === "snowy" && (
        <>
          <CloudLayer />
          <SnowLayer />
        </>
      )}
      {isWindy && <WindLayer />}

      {/* ---- foreground content ---- */}
      <div className="weather-shell">
        <div className="weather-topbar">
          <Link to="/" className="weather-back">
            ← Home
          </Link>
          <h1 className="weather-title">Weather Dashboard</h1>
          <span className="weather-topbar-spacer" />
        </div>

        <form className="weather-form" onSubmit={search}>
          <input
            type="text"
            placeholder="Enter a city..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="weather-input"
          />
          <button type="submit" className="weather-btn" disabled={loading}>
            {loading ? "..." : "Search"}
          </button>
        </form>

        {error && <p className="weather-error">{error}</p>}

        {loading && (
          <div className="weather-loader" aria-label="Loading">
            <span />
            <span />
            <span />
          </div>
        )}

        {!data && !loading && !error && (
          <p className="weather-hint">Search a city to see live conditions.</p>
        )}

        {data && !loading && (
          <div className="weather-result">
            <div className="weather-main">
              <div className="weather-icon">{condition.icon}</div>
              <div>
                <h2 className="weather-city">
                  {data.name}, {data.sys.country}
                </h2>
                <p className="weather-desc">{data.weather[0].description}</p>
              </div>
              <p className="weather-temp">{Math.round(data.main.temp)}°C</p>
            </div>

            <div className="weather-stats">
              <div className="stat">
                <span className="stat-label">Feels like</span>
                <span className="stat-value">
                  {Math.round(data.main.feels_like)}°C
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Humidity</span>
                <span className="stat-value">{data.main.humidity}%</span>
              </div>
              <div className="stat">
                <span className="stat-label">
                  Wind {isWindy ? "💨" : ""}
                </span>
                <span className="stat-value">{windSpeed} m/s</span>
              </div>
              <div className="stat">
                <span className="stat-label">Pressure</span>
                <span className="stat-value">{data.main.pressure} hPa</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}