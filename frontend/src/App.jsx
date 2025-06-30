import React, { useState, useEffect } from "react";
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
  // Auth state
  const [jwt, setJwt] = useState("");
  const [authError, setAuthError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // City/state
  const [city, setCity] = useState("");
  const [cities, setCities] = useState([]);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState("C");
  const [recent, setRecent] = useState([]);

  // Flask features
  const [history, setHistory] = useState(null);
  const [historyError, setHistoryError] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [recError, setRecError] = useState("");

  // Fetch city list from Node.js on mount
  useEffect(() => {
    fetch("http://localhost:4000/cities")
      .then((res) => res.json())
      .then((data) => {
        setCities(data.cities || []);
        if (data.cities && data.cities.length > 0) setCity(data.cities[0]);
      })
      .catch(() => setCities([]));
  }, []);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setJwt("");
    setHistory(null);
    setRecommendation(null);
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setJwt(data.token);
      } else {
        setAuthError(data.error || "Login failed");
      }
    } catch {
      setAuthError("Login failed");
    }
  };

  // Weather fetch
  const fetchWeather = async (e) => {
    e && e.preventDefault();
    setError("");
    setWeather(null);
    setLoading(true);
    setHistory(null);
    setRecommendation(null);

    try {
      const res = await fetch(
        `http://localhost:4000/weather?city=${encodeURIComponent(city)}`
      );
      const data = await res.json();

      // Validate response
      await weatherSchema.validate(data);
      setWeather(data);

      // Update recent (last 3 unique cities)
      setRecent((prev) => {
        const updated = [data.city, ...prev.filter((c) => c !== data.city)];
        return updated.slice(0, 3);
      });
    } catch (err) {
      setError(err.message || "Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  };

  // Fetch history from Flask
  const fetchHistory = async () => {
    setHistoryError("");
    setHistory(null);
    setRecommendation(null);
    try {
      const res = await fetch(
        `http://localhost:5000/history?city=${encodeURIComponent(city)}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      const data = await res.json();
      if (res.ok && data.history) {
        setHistory(data.history);
      } else {
        setHistoryError(data.error || "Failed to fetch history");
      }
    } catch {
      setHistoryError("Failed to fetch history");
    }
  };

  // Fetch recommendation from Flask
  const fetchRecommendation = async () => {
    setRecError("");
    setRecommendation(null);
    try {
      const res = await fetch(
        `http://localhost:5000/recommendation?city=${encodeURIComponent(city)}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      const data = await res.json();
      if (res.ok && data.recommendation) {
        setRecommendation(data.recommendation);
      } else {
        setRecError(data.error || "Failed to fetch recommendation");
      }
    } catch {
      setRecError("Failed to fetch recommendation");
    }
  };

  const handleUnitToggle = () => {
    setUnit((prev) => (prev === "C" ? "F" : "C"));
  };

  const handleRecentClick = (cityName) => {
    setCity(cityName);
    setError("");
    setWeather(null);
    setLoading(true);
    setHistory(null);
    setRecommendation(null);
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
    setCity(cities[0] || "");
    setWeather(null);
    setError("");
    setHistory(null);
    setRecommendation(null);
    setHistoryError("");
    setRecError("");
  };

  // Styles
  const bgStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
    padding: 0,
    margin: 0,
  };

  const cardStyle = {
    marginTop: 24,
    padding: 24,
    borderRadius: 16,
    background: "rgba(255,255,255,0.95)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    textAlign: "center",
    position: "relative",
  };

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

  const inputStyle = {
    width: "60%",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #bbb",
    fontSize: 16,
  };

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
          maxWidth: 520,
          margin: "48px auto",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <h2 style={{ textAlign: "center", color: "#2d3a4a", letterSpacing: 1 }}>
          Weather Dashboard
        </h2>
        {/* Login Form */}
        {!jwt ? (
          <form
            onSubmit={handleLogin}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 24,
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              maxWidth: 340,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <h3 style={{ marginBottom: 12 }}>Login (Flask Auth)</h3>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ ...inputStyle, width: "90%", marginBottom: 10 }}
              autoComplete="username"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inputStyle, width: "90%", marginBottom: 10 }}
              autoComplete="current-password"
            />
            <button type="submit" style={{ ...buttonStyle, width: "100%" }}>
              Login
            </button>
            {authError && (
              <p style={{ color: "red", marginTop: 10 }}>{authError}</p>
            )}
            <p style={{ color: "#888", fontSize: 13, marginTop: 10 }}>
              Demo: testuser / testpass
            </p>
          </form>
        ) : (
          <>
            {/* City selection and weather */}
            <form
              onSubmit={fetchWeather}
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 12,
                gap: 8,
              }}
            >
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{
                  ...inputStyle,
                  width: 180,
                  padding: 10,
                  fontSize: 16,
                  marginRight: 0,
                }}
              >
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
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
            {recent.length > 0 && (
              <div style={historyStyle}>
                {recent.map((c) => (
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
                    onClick={() => handleRecentClick(c)}
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
                {/* Flask features */}
                <div style={{ marginTop: 18 }}>
                  <button
                    style={{
                      ...buttonStyle,
                      background: "#2ecc71",
                      color: "#fff",
                      marginLeft: 0,
                    }}
                    onClick={fetchHistory}
                  >
                    Show History
                  </button>
                  <button
                    style={{
                      ...buttonStyle,
                      background: "#e67e22",
                      color: "#fff",
                    }}
                    onClick={fetchRecommendation}
                  >
                    Get Recommendation
                  </button>
                </div>
              </div>
            )}
            {/* History display */}
            {historyError && (
              <p style={{ color: "red", textAlign: "center", marginTop: 16 }}>
                History Error: {historyError}
              </p>
            )}
            {history && (
              <div style={cardStyle}>
                <h4 style={{ marginBottom: 10 }}>Last 7 Days (History)</h4>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 15,
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ borderBottom: "1px solid #ccc" }}>Date</th>
                      <th style={{ borderBottom: "1px solid #ccc" }}>
                        Temperature
                      </th>
                      <th style={{ borderBottom: "1px solid #ccc" }}>
                        Condition
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.date}>
                        <td style={{ padding: 4 }}>{h.date}</td>
                        <td style={{ padding: 4 }}>{h.temperature}°C</td>
                        <td style={{ padding: 4 }}>
                          {weatherIcons[h.condition] || weatherIcons.Default}{" "}
                          {h.condition}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Recommendation display */}
            {recError && (
              <p style={{ color: "red", textAlign: "center", marginTop: 16 }}>
                Recommendation Error: {recError}
              </p>
            )}
            {recommendation && (
              <div style={cardStyle}>
                <h4 style={{ marginBottom: 10 }}>Best Day to Visit</h4>
                <p>
                  <strong>Date:</strong> {recommendation.date}
                </p>
                <p>
                  <strong>Temperature:</strong> {recommendation.temperature}°C
                </p>
                <p>
                  <strong>Condition:</strong>{" "}
                  {weatherIcons[recommendation.condition] ||
                    weatherIcons.Default}{" "}
                  {recommendation.condition}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
