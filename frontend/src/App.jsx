import React, { useState } from "react";
import * as Yup from "yup";

// Yup schema for weather response validation
const weatherSchema = Yup.object().shape({
  city: Yup.string().required(),
  temperature: Yup.number().required(),
  condition: Yup.string().required(),
  updatedAt: Yup.string().required(),
});

// Weather icons by condition
const weatherIcons = {
  Sunny: "☀️",
  Cloudy: "☁️",
  Hot: "🔥",
  Rainy: "🌧️",
  Windy: "💨",
  Default: "🌈",
};

function cToF(c) {
  return (c * 9) / 5 + 32;
}

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState("C");
  const [history, setHistory] = useState([]);

  const fetchWeather = async (e) => {
    e.preventDefault();
    setError("");
    setWeather(null);
    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:4000/weather?city=${encodeURIComponent(city)}`
      );
      const data = await res.json();

      // Validate response
      await weatherSchema.validate(data);
      setWeather(data);

      // Update history (last 3 unique cities)
      setHistory((prev) => {
        const updated = [data.city, ...prev.filter((c) => c !== data.city)];
        return updated.slice(0, 3);
      });
    } catch (err) {
      setError(err.message || "Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  };

  const handleUnitToggle = () => {
    setUnit((prev) => (prev === "C" ? "F" : "C"));
  };

  const handleHistoryClick = (cityName) => {
    setCity(cityName);
    setError("");
    setWeather(null);
    setLoading(true);
    fetch(
      `http://localhost:4000/weather?city=${encodeURIComponent(cityName)}`
    )
      .then((res) => res.json())
      .then(async (data) => {
        await weatherSchema.validate(data);
        setWeather(data);
      })
      .catch((err) => setError(err.message || "Failed to fetch weather"))
      .finally(() => setLoading(false));
  };

  const handleClear = () => {
    setCity("");
    setWeather(null);
    setError("");
  };

  // Background gradient style
  const bgStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
    padding: 0,
    margin: 0,
  };

  // Card style
  const cardStyle = {
    marginTop: 24,
    padding: 24,
    borderRadius: 16,
    background: "rgba(255,255,255,0.95)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    textAlign: "center",
    position: "relative",
  };

  // Button style
  const buttonStyle = {
    padding: "8px 16px",
    marginLeft: 8,
    borderRadius: 6,
    border: "none",
    background: "#66a6ff",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
  };

  // Input style
  const inputStyle = {
    width: "60%",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #bbb",
    fontSize: 16,
  };

  // History style
  const historyStyle = {
    display: "flex",
    gap: 8,
    marginTop: 16,
    justifyContent: "center",
  };

  return (
    <div style={bgStyle}>
      <div
        style={{
          maxWidth: 420,
          margin: "48px auto",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <h2 style={{ textAlign: "center", color: "#2d3a4a", letterSpacing: 1 }}>
          Weather Dashboard
        </h2>
        <form
          onSubmit={fetchWeather}
          style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}
        >
          <input
            type="text"
            placeholder="Enter city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>
            Get Weather
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, background: "#bbb", color: "#222" }}
            onClick={handleClear}
          >
            Clear
          </button>
        </form>
        {history.length > 0 && (
          <div style={historyStyle}>
            {history.map((c) => (
              <button
                key={c}
                style={{
                  ...buttonStyle,
                  background: "#fff",
                  color: "#66a6ff",
                  border: "1px solid #66a6ff",
                  fontWeight: 500,
                  marginLeft: 0,
                }}
                onClick={() => handleHistoryClick(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        {loading && (
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <span role="img" aria-label="loading" style={{ fontSize: 32 }}>
              ⏳
            </span>
            <p>Loading...</p>
          </div>
        )}
        {error && (
          <p style={{ color: "red", textAlign: "center", marginTop: 16 }}>
            Error: {error}
          </p>
        )}
        {weather && (
          <div style={cardStyle}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>
              {weatherIcons[weather.condition] || weatherIcons.Default}
            </div>
            <h3 style={{ margin: "8px 0 4px 0", color: "#2d3a4a" }}>
              {weather.city}
            </h3>
            <p style={{ fontSize: 22, margin: "8px 0" }}>
              <strong>Temperature:</strong>{" "}
              {unit === "C"
                ? `${weather.temperature}°C`
                : `${cToF(weather.temperature).toFixed(1)}°F`}
              <button
                onClick={handleUnitToggle}
                style={{
                  ...buttonStyle,
                  background: "#f5f6fa",
                  color: "#2d3a4a",
                  fontSize: 14,
                  marginLeft: 12,
                  padding: "4px 10px",
                }}
                type="button"
              >
                Show °{unit === "C" ? "F" : "C"}
              </button>
            </p>
            <p style={{ fontSize: 18, margin: "8px 0" }}>
              <strong>Condition:</strong> {weather.condition}
            </p>
            <p style={{ color: "#888", fontSize: 13, marginTop: 12 }}>
              <small>
                Updated at: {new Date(weather.updatedAt).toLocaleString()}
              </small>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
