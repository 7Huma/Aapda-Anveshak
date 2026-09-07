import React, { useEffect, useMemo, useState } from 'react';
import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  ZoomControl,
} from 'react-leaflet';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { LatLngExpression } from 'leaflet';


// ============================================================
// TYPES
// ============================================================

type Location = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  risk: number;
  level: string;
  rainfall: number;
  soil: number;
  slope: number;
  elevation: number;
  snow?: number | null;
  confidence?: number;
  terrain_roughness?: number;
  historical_landslide_count?: number;
};


// ============================================================
// INITIAL DATA
// Used only while the live API is loading.
// ============================================================

const initialLocations: Location[] = [
  {
    id: 101,
    name: 'Sikkim North',
    lat: 27.62,
    lng: 88.71,
    risk: 94,
    level: 'CRITICAL',
    rainfall: 242,
    soil: 91,
    slope: 48,
    elevation: 2100,
  },
  {
    id: 102,
    name: 'Gangtok East',
    lat: 27.33,
    lng: 88.61,
    risk: 87,
    level: 'HIGH',
    rainfall: 180,
    soil: 82,
    slope: 42,
    elevation: 1850,
  },
  {
    id: 103,
    name: 'Darjeeling Hills',
    lat: 27.04,
    lng: 88.26,
    risk: 78,
    level: 'HIGH',
    rainfall: 165,
    soil: 79,
    slope: 39,
    elevation: 1650,
  },
  {
    id: 104,
    name: 'West Sikkim',
    lat: 27.25,
    lng: 88.22,
    risk: 61,
    level: 'MEDIUM',
    rainfall: 124,
    soil: 68,
    slope: 31,
    elevation: 1500,
  },
  {
    id: 105,
    name: 'Kalimpong',
    lat: 27.07,
    lng: 88.47,
    risk: 34,
    level: 'MEDIUM',
    rainfall: 93,
    soil: 54,
    slope: 26,
    elevation: 1250,
  },
  {
    id: 106,
    name: 'South Sikkim',
    lat: 27.17,
    lng: 88.43,
    risk: 19,
    level: 'LOW',
    rainfall: 58,
    soil: 39,
    slope: 18,
    elevation: 980,
  },
  {
    id: 107,
    name: 'Teesta Valley',
    lat: 27.55,
    lng: 88.65,
    risk: 84,
    level: 'HIGH',
    rainfall: 171,
    soil: 84,
    slope: 45,
    elevation: 1720,
  },
  {
    id: 108,
    name: 'Rangpo',
    lat: 27.18,
    lng: 88.53,
    risk: 46,
    level: 'MEDIUM',
    rainfall: 111,
    soil: 61,
    slope: 29,
    elevation: 890,
  },
];


// ============================================================
// STATIC DASHBOARD DATA
// ============================================================

const infraData = [
  { name: 'Severe', value: 18 },
  { name: 'Moderate', value: 7 },
  { name: 'Minor', value: 6 },
  { name: 'No damage', value: 12 },
];

const supportUnits = [
  ['Emergency Admin', 12],
  ['Fire & Rescue', 18],
  ['Armed Forces', 27],
  ['Police', 30],
];


// ============================================================
// COLORS
// ============================================================

const riskColor = (level: string) => {
  if (level === 'CRITICAL') return '#ff1717';
  if (level === 'HIGH') return '#ff9f00';
  if (level === 'MEDIUM') return '#fff000';
  return '#51e800';
};


// ============================================================
// APP
// ============================================================

function App() {
  const [locations, setLocations] =
    useState<Location[]>(initialLocations);

  const [selectedId, setSelectedId] =
    useState<number>(102);

  const [layer, setLayer] =
    useState<'terrain' | 'street'>('terrain');

  const [loading, setLoading] =
    useState<boolean>(true);

  const [apiError, setApiError] =
    useState<string>('');

  const [lastUpdated, setLastUpdated] =
    useState<string | null>(null);


  // ============================================================
  // FETCH LIVE DATA
  // ============================================================

  const fetchLiveData = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        'http://localhost:8000/api/risk/live'
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}`
        );
      }

      const data = await response.json();

      if (
        !data.locations ||
        !Array.isArray(data.locations)
      ) {
        throw new Error(
          'Invalid response from backend'
        );
      }

      // Keep only locations where the ML/backend
      // actually returned a numeric risk score.
      const validLocations = data.locations.filter(
        (location: Location) =>
          typeof location.risk === 'number'
      );

      if (validLocations.length > 0) {
        setLocations(validLocations);
      }

      setLastUpdated(data.updated_at ?? null);
      setApiError('');

    } catch (error) {
      console.error(
        'Live risk API error:',
        error
      );

      // Keep the working initial dashboard visible.
      setApiError(
        'Unable to connect to Earth Engine backend'
      );

    } finally {
      setLoading(false);
    }
  };


  // ============================================================
  // LOAD LIVE DATA + REFRESH EVERY 5 MINUTES
  // ============================================================

  useEffect(() => {
    fetchLiveData();

    const interval = window.setInterval(
      fetchLiveData,
      5 * 60 * 1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);


  // ============================================================
  // SELECTED LOCATION
  // ============================================================

  const selected =
    locations.find(
      (location) =>
        location.id === selectedId
    ) ?? locations[0];


  // ============================================================
  // MAP CENTER
  // ============================================================

  const center: LatLngExpression = [
    27.33,
    88.48,
  ];


  // ============================================================
  // AVERAGE RISK
  // ============================================================

  const avgRisk =
    locations.length > 0
      ? Math.round(
          locations.reduce(
            (total, location) =>
              total + location.risk,
            0
          ) / locations.length
        )
      : 0;


  // ============================================================
  // DYNAMIC SEVERITY DATA
  // ============================================================

  const severityData = useMemo(
    () => [
      {
        name: 'Critical',
        value: locations.filter(
          (x) => x.level === 'CRITICAL'
        ).length,
        color: '#ff1717',
      },
      {
        name: 'High',
        value: locations.filter(
          (x) => x.level === 'HIGH'
        ).length,
        color: '#ff9f00',
      },
      {
        name: 'Medium',
        value: locations.filter(
          (x) => x.level === 'MEDIUM'
        ).length,
        color: '#fff000',
      },
      {
        name: 'Low',
        value: locations.filter(
          (x) => x.level === 'LOW'
        ).length,
        color: '#51e800',
      },
    ],
    [locations]
  );


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="dashboard-shell">

      {/* ======================================================
          TOP BAR
      ====================================================== */}

      <header className="topbar">

        <div className="brand">
          <span className="mountain">
            ▲
          </span>

          <div>
            <strong>
              LANDSLIDE RISK
            </strong>

            <small>
              AI EARLY WARNING & MONITORING
            </small>
          </div>
        </div>

        <div className="topbar-center">

          <span className="live-dot" />

          {loading
            ? ' UPDATING'
            : ' LIVE MONITORING'}

          <span className="divider" />

          NORTH-EAST INDIA

        </div>

        <div className="top-actions">
          <button title="Alerts">
            ◉
          </button>

          <button title="Layers">
            ▱
          </button>

          <button title="Settings">
            ⚙
          </button>
        </div>

      </header>


      {/* ======================================================
          MAIN GRID
      ====================================================== */}

      <section className="main-grid">


        {/* ====================================================
            LEFT PANEL
        ==================================================== */}

        <aside className="left-panel panel-stack">

          {/* LEGEND */}

          <div className="panel legend-panel">

            <div className="panel-title">
              LEGENDA
            </div>

            <div className="legend-section-title">
              Risk zones
            </div>

            <div className="legend-row">
              <span className="legend-dot critical" />
              Critical
              <b>75–100</b>
            </div>

            <div className="legend-row">
              <span className="legend-dot high" />
              High
              <b>50–74</b>
            </div>

            <div className="legend-row">
              <span className="legend-dot medium" />
              Medium
              <b>25–49</b>
            </div>

            <div className="legend-row">
              <span className="legend-dot low" />
              Low
              <b>0–24</b>
            </div>

            <div className="legend-divider" />

            <div className="legend-section-title">
              Map layers
            </div>

            <button
              className={`layer-option ${
                layer === 'terrain'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setLayer('terrain')
              }
            >
              <span>▣</span>
              Terrain / satellite
            </button>

            <button
              className={`layer-option ${
                layer === 'street'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setLayer('street')
              }
            >
              <span>⌁</span>
              Roads & villages
            </button>

          </div>


          {/* AFFECTED */}

          <div className="panel affected-panel">

            <div className="panel-title centered">
              AFFECTED ESTIMATED
            </div>

            <div className="affected-head">
              <span>RISK</span>
              <span>LOCATIONS</span>
              <span>PEOPLE</span>
            </div>

            {[
              [
                'critical',
                String(
                  severityData[0].value
                ),
                '1,240',
              ],
              [
                'high',
                String(
                  severityData[1].value
                ),
                '3,820',
              ],
              [
                'medium',
                String(
                  severityData[2].value
                ),
                '6,180',
              ],
              [
                'low',
                String(
                  severityData[3].value
                ),
                '12,450',
              ],
            ].map(
              ([
                type,
                count,
                people,
              ]) => (
                <div
                  className="affected-row"
                  key={type}
                >
                  <span
                    className={`mini-tag ${type}`}
                  />

                  <b>{count}</b>

                  <span>
                    {people}
                  </span>
                </div>
              )
            )}

            <div className="update-note">
              Last update:{' '}
              <strong>
                {lastUpdated
                  ? new Date(
                      lastUpdated
                    ).toLocaleTimeString()
                  : 'just now'}
              </strong>
            </div>

          </div>


          {/* LINKS */}

          <div className="panel links-panel">

            <div className="panel-title centered">
              DATA REGISTRATION LINKS
            </div>

            <div className="link-item">
              <span>1)</span>
              Field capacity / infrastructure survey
            </div>

            <div className="link-item">
              <span>2)</span>
              Landslide / damage / injury report
            </div>

            <div className="link-item">
              <span>3)</span>
              Support units / evacuation needs
            </div>

            <p>
              Field forms are ready to connect
              to the backend and can be replaced
              by live APIs later.
            </p>

          </div>

        </aside>


        {/* ====================================================
            MAP
        ==================================================== */}

        <section className="map-panel">

          <div className="map-toolbar">

            <span className="map-location">
              Sikkim • Darjeeling • North Bengal
            </span>

            <button>⌂</button>
            <button>☷</button>
            <button>▱</button>
            <button>⋮</button>

          </div>


          <MapContainer
            center={center}
            zoom={9}
            zoomControl={false}
            className="risk-map"
          >

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url={
                layer === 'terrain'
                  ? 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
                  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              }
            />

            <ZoomControl position="bottomright" />


            {locations.map((loc) => (

              <React.Fragment
                key={loc.id}
              >

                <Circle
                  center={[
                    loc.lat,
                    loc.lng,
                  ]}
                  radius={
                    loc.risk * 30
                  }
                  pathOptions={{
                    color:
                      riskColor(
                        loc.level
                      ),
                    fillColor:
                      riskColor(
                        loc.level
                      ),
                    fillOpacity: 0.12,
                    weight: 1,
                  }}
                />


                <CircleMarker
                  center={[
                    loc.lat,
                    loc.lng,
                  ]}
                  radius={8}
                  pathOptions={{
                    color: '#fff',
                    weight: 2,
                    fillColor:
                      riskColor(
                        loc.level
                      ),
                    fillOpacity: 1,
                  }}
                  eventHandlers={{
                    click: () =>
                      setSelectedId(
                        loc.id
                      ),
                  }}
                >

                  <Popup>

                    <div className="popup">

                      <strong>
                        {loc.name}
                      </strong>

                      <span
                        style={{
                          color:
                            riskColor(
                              loc.level
                            ),
                        }}
                      >
                        {loc.level} •{' '}
                        {loc.risk}/100
                      </span>

                      <small>
                        Rainfall{' '}
                        {loc.rainfall} mm •
                        Soil{' '}
                        {loc.soil}% •
                        Slope{' '}
                        {loc.slope}°
                      </small>

                    </div>

                  </Popup>

                </CircleMarker>

              </React.Fragment>

            ))}

          </MapContainer>


          <div className="map-legend-bottom">

            <span>
              <i className="legend-dot critical" />
              Critical
            </span>

            <span>
              <i className="legend-dot high" />
              High
            </span>

            <span>
              <i className="legend-dot medium" />
              Medium
            </span>

            <span>
              <i className="legend-dot low" />
              Low
            </span>

          </div>

        </section>


        {/* ====================================================
            RIGHT PANEL
        ==================================================== */}

        <aside className="right-panel panel-stack">


          {/* VERIFIED RISK EVENTS */}

          <div className="panel verified-panel">

            <div className="panel-title">
              VERIFIED RISK EVENTS
            </div>

            <div className="verified-layout">

              <div className="severity-chart">

                <ResponsiveContainer
                  width="100%"
                  height={180}
                >

                  <BarChart
                    data={severityData}
                    layout="vertical"
                    margin={{
                      left: 0,
                      right: 12,
                      top: 10,
                      bottom: 5,
                    }}
                  >

                    <CartesianGrid
                      stroke="#333"
                      horizontal={false}
                    />

                    <XAxis
                      type="number"
                      stroke="#777"
                      tick={{
                        fontSize: 10,
                      }}
                    />

                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#aaa"
                      tick={{
                        fontSize: 11,
                      }}
                      width={58}
                    />

                    <Tooltip
                      contentStyle={{
                        background: '#111',
                        border:
                          '1px solid #444',
                        color: '#fff',
                      }}
                    />

                    <Bar
                      dataKey="value"
                      radius={[
                        0,
                        2,
                        2,
                        0,
                      ]}
                    >

                      {severityData.map(
                        (entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.color}
                          />
                        )
                      )}

                    </Bar>

                  </BarChart>

                </ResponsiveContainer>

              </div>


              <div className="severity-cards">

                <SeverityCard
                  color="#e20d0d"
                  icon="⚠"
                  value={String(
                    severityData[0]
                      .value
                  )}
                  label="CRITICAL"
                />

                <SeverityCard
                  color="#ff9f00"
                  icon="⚠"
                  value={String(
                    severityData[1]
                      .value
                  )}
                  label="HIGH"
                />

                <SeverityCard
                  color="#fff000"
                  icon="⚠"
                  value={String(
                    severityData[2]
                      .value
                  )}
                  label="MEDIUM"
                  dark
                />

              </div>

            </div>

          </div>


          {/* INFRASTRUCTURE */}

          <div className="panel infrastructure-panel">

            <div className="panel-title">

              INFRASTRUCTURE AFFECTED

              <span>
                • Verification
              </span>

            </div>

            <ResponsiveContainer
              width="100%"
              height={165}
            >

              <BarChart
                data={infraData}
                layout="vertical"
                margin={{
                  left: 0,
                  right: 22,
                  top: 10,
                  bottom: 4,
                }}
              >

                <CartesianGrid
                  stroke="#2d2d2d"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  domain={[0, 20]}
                  stroke="#666"
                  tick={{
                    fontSize: 9,
                  }}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#aaa"
                  tick={{
                    fontSize: 10,
                  }}
                  width={70}
                />

                <Bar
                  dataKey="value"
                  radius={[
                    0,
                    2,
                    2,
                    0,
                  ]}
                >

                  {infraData.map(
                    (entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={[
                          '#ff1717',
                          '#ff9f00',
                          '#fff000',
                          '#51e800',
                        ][i]}
                      />
                    )
                  )}

                </Bar>

              </BarChart>

            </ResponsiveContainer>

            <div className="update-note right">
              Last update:{' '}
              {lastUpdated
                ? new Date(
                    lastUpdated
                  ).toLocaleTimeString()
                : 'just now'}
            </div>

          </div>


          {/* BOTTOM RIGHT */}

          <div className="bottom-right-grid">


            {/* EVACUATION */}

            <div className="panel evacuation-panel">

              <div className="panel-title purple-title">
                EVACUATION POINTS
              </div>

              <div className="gauge-wrap">

                <PieChart
                  width={220}
                  height={135}
                >

                  <Pie
                    data={[
                      { value: 330 },
                      { value: 490 },
                    ]}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={62}
                    outerRadius={82}
                    dataKey="value"
                    stroke="none"
                  >

                    <Cell fill="#ff9f00" />
                    <Cell fill="#ddd" />

                  </Pie>

                </PieChart>

                <div className="gauge-value">
                  330
                </div>

              </div>

              <div className="gauge-label">
                People evacuated
              </div>

              <div className="gauge-scale">
                <span>0</span>
                <span>820</span>
              </div>

              <div className="update-note">
                Last update: just now
              </div>

            </div>


            {/* SUPPORT */}

            <div className="panel support-panel">

              <div className="panel-title">
                AVAILABLE SUPPORT UNITS
              </div>

              {supportUnits.map(
                ([name, value]) => (

                  <div
                    className="support-row"
                    key={name}
                  >

                    <span className="support-icon">
                      ✚
                    </span>

                    <span>
                      {name}
                    </span>

                    <b>
                      {value}
                    </b>

                  </div>

                )
              )}

              <div className="update-note right">
                Last update: just now
              </div>

            </div>

          </div>


          {/* SELECTED LOCATION */}

          {selected && (

            <div className="panel details-panel">

              <div className="panel-title">
                SELECTED LOCATION
              </div>

              <div className="selected-location">

                <div>

                  <strong>
                    {selected.name}
                  </strong>

                  <small>
                    Location ID:{' '}
                    {selected.id}
                  </small>

                </div>

                <span
                  className="risk-pill"
                  style={{
                    background:
                      riskColor(
                        selected.level
                      ),
                    color:
                      selected.level ===
                      'MEDIUM'
                        ? '#111'
                        : '#fff',
                  }}
                >
                  {selected.level}{' '}
                  {selected.risk}
                </span>

              </div>


              <div className="metric-grid">

                <Metric
                  label="Rainfall"
                  value={`${selected.rainfall} mm`}
                />

                <Metric
                  label="Soil moisture"
                  value={`${selected.soil}%`}
                />

                <Metric
                  label="Slope"
                  value={`${selected.slope}°`}
                />

                <Metric
                  label="Elevation"
                  value={`${selected.elevation} m`}
                />

              </div>

            </div>

          )}

        </aside>

      </section>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="footerbar">

        <span>
          AI-Based Early Warning & Landslide
          Risk Monitoring System
        </span>

        <span>
          Avg. risk{' '}
          <b>
            {avgRisk}/100
          </b>
        </span>

        <span>
          Data mode:{' '}

          <b>
            {loading
              ? 'UPDATING...'
              : apiError
                ? 'OFFLINE / LAST DATA'
                : 'GOOGLE EARTH ENGINE'}
          </b>
        </span>

      </footer>


      {/* API ERROR MESSAGE */}

      {apiError && (
        <div
          style={{
            position: 'fixed',
            bottom: 12,
            left: '50%',
            transform:
              'translateX(-50%)',
            zIndex: 9999,
            padding:
              '8px 16px',
            borderRadius: 8,
            background:
              '#7f1d1d',
            color: '#fff',
            fontSize: 12,
          }}
        >
          {apiError}
        </div>
      )}

    </main>
  );
}


// ============================================================
// COMPONENTS
// ============================================================

function SeverityCard({
  color,
  icon,
  value,
  label,
  dark = false,
}: {
  color: string;
  icon: string;
  value: string;
  label: string;
  dark?: boolean;
}) {
  return (
    <div
      className="severity-card"
      style={{
        background: color,
        color: dark
          ? '#111'
          : '#fff',
      }}
    >
      <span className="severity-icon">
        {icon}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {label}
      </small>
    </div>
  );
}


function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="metric">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


export default App;