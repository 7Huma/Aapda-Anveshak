import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './styles.css';
import 'leaflet/dist/leaflet.css';

import Layout from './components/Layout';
import App from './App';
import LiveWeather from './components/LiveWeather';

import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import RiskMap from './pages/RiskMap';
import ComingSoon from './pages/ComingSoon';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        <Route element={<Layout />}>

          <Route path="/" element={<App />} />

          <Route path="/reports" element={<Reports />} />

          <Route path="/alerts" element={<Alerts />} />

          {/* REAL RISK MAP */}
          <Route
  path="/risk-map"
  element={<RiskMap />}
/>

          {/* REAL LIVE WEATHER */}
          <Route
            path="/live-weather"
            element={<LiveWeather />}
          />

          

        </Route>

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);