import { useState } from "react";
import { Link } from "react-router-dom";
import "./Weather.css";

// Put your key in a .env file as VITE_WEATHER_API_KEY (OpenWeatherMap)
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

// Maps OpenWeatherMap's "main" condition to an animation class + emoji
const CONDITION_MAP = {
  Clear: { anim: "sunny", icon: "☀️" },
  Clouds: { anim: "cloudy", icon: "☁️" },
  Rain: { anim: "rainy", icon: "🌧️" },
  Drizzle: { anim: "rainy", icon: "🌦️" },
  Thunderstorm: { anim: "stormy", icon: "⛈️" },
  Snow: { anim: "snowy", icon: "❄️" },
  Mist: { anim: "cloudy", icon: "🌫️" },
  Haze: { anim: "cloudy", icon: "🌫️" },
};

function getCondition(main) {
  return CONDITION_MAP[main] || { anim: "cloudy", icon: "🌤️" };
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

  return (
    <div className={`weather-page${condition ? ` bg-${condition.anim}` : ""}`}>
      <div className="weather-ambient" aria-hidden="true" />

      <div className="weather-card">
        <Link to="/" className="weather-back">
          ← Home
        </Link>
        <h1 className="weather-title">Weather Dashboard</h1>

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

        {data && !loading && (
          <div className="weather-result">
            <div className={`weather-icon anim-${condition.anim}`}>
              {condition.icon}
            </div>
            <h2 className="weather-city">
              {data.name}, {data.sys.country}
            </h2>
            <p className="weather-temp">{Math.round(data.main.temp)}°C</p>
            <p className="weather-desc">{data.weather[0].description}</p>

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
                <span className="stat-label">Wind</span>
                <span className="stat-value">{data.wind.speed} m/s</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}