import React, { useEffect, useState } from "react";


type WeatherData = {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  precipitation: number;
  rain: number;
  wind_speed_10m: number;
  surface_pressure: number;
  weather_code: number;
};

const locations = [
  { name: "Sikkim", lat: 27.33, lon: 88.61 },
  { name: "Gangtok", lat: 27.3389, lon: 88.6065 },
  { name: "Darjeeling", lat: 27.041, lon: 88.2663 },
  { name: "Kalimpong", lat: 27.0667, lon: 88.4667 },
];

function getCondition(code: number) {
  if (code === 0) return "Clear sky";
  if ([1, 2, 3].includes(code)) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([80, 81, 82].includes(code)) return "Rain showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Unknown";
}

export default function LiveWeather() {
  const [location, setLocation] = useState(locations[0]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWeather = async () => {
    try {
      setLoading(true);
      setError("");

      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${location.lat}` +
        `&longitude=${location.lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,wind_speed_10m,surface_pressure,weather_code` +
        `&timezone=auto`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Weather API failed");
      }

      const data = await response.json();

      setWeather(data.current);
    } catch (err) {
      console.error(err);
      setError("Unable to load live weather.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();

    const timer = window.setInterval(
      loadWeather,
      5 * 60 * 1000
    );

    return () => window.clearInterval(timer);
  }, [location]);

  return (
    <div className="live-weather-page">

      <div className="weather-header">
        <div>
          <h1>Live Weather</h1>

          <p>
            Real-time weather conditions for landslide monitoring
          </p>
        </div>

        <select
          value={location.name}
          onChange={(e) => {
            const selected = locations.find(
              (item) => item.name === e.target.value
            );

            if (selected) {
              setLocation(selected);
            }
          }}
        >
          {locations.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="weather-message">
          Loading live weather...
        </div>
      )}

      {error && (
        <div className="weather-message error">
          {error}
        </div>
      )}

      {weather && !loading && (
        <>
          <div className="weather-main-card">

            <div>
              <div className="weather-location">
                {location.name}
              </div>

              <div className="weather-temperature">
                {Math.round(weather.temperature_2m)}°C
              </div>

              <div className="weather-condition">
                {getCondition(weather.weather_code)}
              </div>
            </div>

            <div className="weather-icon">
              {weather.weather_code >= 51 ? "🌧️" : "☁️"}
            </div>

          </div>

          <div className="weather-grid">

            <div className="weather-card">
              <span>Feels Like</span>
              <strong>
                {Math.round(weather.apparent_temperature)}°C
              </strong>
            </div>

            <div className="weather-card">
              <span>Humidity</span>
              <strong>
                {weather.relative_humidity_2m}%
              </strong>
            </div>

            <div className="weather-card">
              <span>Rainfall</span>
              <strong>
                {weather.precipitation} mm
              </strong>
            </div>

            <div className="weather-card">
              <span>Wind</span>
              <strong>
                {weather.wind_speed_10m} km/h
              </strong>
            </div>

            <div className="weather-card">
              <span>Pressure</span>
              <strong>
                {Math.round(weather.surface_pressure)} hPa
              </strong>
            </div>

          </div>

          <div className="weather-risk-card">
            <h2>Landslide Monitoring</h2>

            <p>
              Current rainfall:{" "}
              <strong>{weather.rain} mm</strong>
            </p>

            <p>
              Weather conditions are being monitored as an
              environmental factor for landslide risk assessment.
            </p>
          </div>

          <div className="weather-updated">
            LIVE API DATA • REFRESHES EVERY 5 MINUTES
          </div>
        </>
      )}

    </div>
  );
}