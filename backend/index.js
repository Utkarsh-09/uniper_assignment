const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Mock weather data generator
function getMockWeather(city) {
  const weatherOptions = [
    { temp: 25, condition: 'Sunny' },
    { temp: 18, condition: 'Cloudy' },
    { temp: 30, condition: 'Hot' },
    { temp: 15, condition: 'Rainy' },
    { temp: 22, condition: 'Windy' }
  ];
  const random = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
  return {
    city,
    temperature: random.temp,
    condition: random.condition,
    updatedAt: new Date().toISOString()
  };
}

// GET /weather?city=CityName
app.get('/weather', (req, res) => {
  const city = req.query.city;
  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }
  const weather = getMockWeather(city);
  res.json(weather);
});

app.get('/cities', (req, res) => {
  // Mock list of cities
  const cities = [
    "London",
    "New York",
    "Paris",
    "Tokyo",
    "Sydney",
    "Berlin",
    "Mumbai"
  ];
  res.json({ cities });
});

app.listen(PORT, () => {
  console.log(`Weather backend running on http://localhost:${PORT}`);
});
