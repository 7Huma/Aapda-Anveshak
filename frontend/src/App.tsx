import EonetPanel from './components/EonetPanel';
import LiveWeather from "./components/LiveWeather";
import React, { useEffect, useMemo, useState } from 'react';
import StartSequence from "./components/StartSequence";
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
// CONFIG
// ============================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000';


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
// LIVE DASHBOARD DATA
// ============================================================

type InfrastructureRow = {
  name: string;
  value: number;
};

type SupportUnitRow = [string, number];

const EMPTY_INFRA_DATA: InfrastructureRow[] = [
  { name: 'Severe', value: 0 },
  { name: 'Moderate', value: 0 },
  { name: 'Minor', value: 0 },
  { name: 'No damage', value: 0 },
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

  const selectedLocation = locations.find(
  (location) => location.id === selectedId
);

  const [layer, setLayer] =
    useState<'terrain' | 'street'>('terrain');

  const [loading, setLoading] =
    useState<boolean>(true);

  const [apiError, setApiError] =
    useState<string>('');

  const [lastUpdated, setLastUpdated] =
    useState<string | null>(null);
 
  const [nasaEvents, setNasaEvents] = useState<any[]>([]);
  const [nasaLoading, setNasaLoading] = useState(true);

  const [infraData, setInfraData] =
    useState<InfrastructureRow[]>(EMPTY_INFRA_DATA);

  const [supportUnits, setSupportUnits] =
    useState<SupportUnitRow[]>([]);

  // Live evacuation figures from /api/dashboard/summary.
  // No demo numbers are used.
  const [evacuationEvacuated, setEvacuationEvacuated] =
    useState(0);

  const [evacuationCapacity, setEvacuationCapacity] =
    useState(0);

  const [dashboardLoading, setDashboardLoading] =
    useState(true);
  const [showStart, setShowStart] = useState(true);

  // ============================================================
  // FETCH LIVE DATA
  // ============================================================

  const fetchLiveData = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/risk/live`
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
// FETCH LIVE DASHBOARD SUMMARY
// Infrastructure/support values come ONLY from the backend.
// No hardcoded demo numbers are used.
// ============================================================

const fetchDashboardData = async () => {
  try {
    setDashboardLoading(true);

    const response = await fetch(
      `${API_BASE_URL}/api/dashboard/summary`
    );

    if (!response.ok) {
      throw new Error(
        `Dashboard API returned ${response.status}`
      );
    }

    const data = await response.json();

    // ------------------------------------------------------------
    // INFRASTRUCTURE
    // ------------------------------------------------------------
    const rawInfrastructure =
      data.infrastructure ??
      data.infrastructure_affected ??
      data.infrastructure_damage ??
      [];

    const infrastructure = Array.isArray(rawInfrastructure)
      ? rawInfrastructure
          .map((item: any) => ({
            name: String(
              item.name ?? item.label ?? ''
            ),
            value: Number(
              item.value ?? item.count ?? 0
            ),
          }))
          .filter(
            (item: InfrastructureRow) =>
              item.name &&
              Number.isFinite(item.value)
          )
      : Object.entries(rawInfrastructure)
          .map(([name, value]) => ({
            name,
            value: Number(value),
          }))
          .filter(
            (item) =>
              Number.isFinite(item.value)
          );

    if (infrastructure.length > 0) {
      setInfraData(infrastructure);
    } else {
      setInfraData(EMPTY_INFRA_DATA);
    }

    // ------------------------------------------------------------
    // SUPPORT UNITS
    // ------------------------------------------------------------
    const rawSupport =
      data.support_units ??
      data.supportUnits ??
      data.available_support_units ??
      [];

    const support = Array.isArray(rawSupport)
      ? rawSupport
          .map(
            (item: any) =>
              [
                String(
                  item.name ??
                  item.label ??
                  ''
                ),
                Number(
                  item.available ??
                  item.value ??
                  item.count ??
                  0
                ),
              ] as SupportUnitRow
          )
          .filter(
            ([name, value]) =>
              name &&
              Number.isFinite(value)
          )
      : Object.entries(rawSupport)
          .map(
            ([name, value]) =>
              [
                name,
                Number(value),
              ] as SupportUnitRow
          )
          .filter(
            ([, value]) =>
              Number.isFinite(value)
          );

    setSupportUnits(support);

    // ------------------------------------------------------------
    // LIVE EVACUATION DATA
    // ------------------------------------------------------------
    const evacuationSource =
      data.evacuation ??
      data.evacuations ??
      data.evacuation_points ??
      data.evacuation_summary ??
      {};

    const evacuatedValue = Number(
      data.people_evacuated ??
      data.evacuated_people ??
      data.evacuated ??
      evacuationSource.people_evacuated ??
      evacuationSource.evacuated_people ??
      evacuationSource.evacuated ??
      evacuationSource.current ??
      0
    );

    const capacityValue = Number(
      data.evacuation_capacity ??
      data.shelter_capacity ??
      data.total_evacuation_capacity ??
      evacuationSource.capacity ??
      evacuationSource.shelter_capacity ??
      evacuationSource.total_capacity ??
      evacuationSource.total ??
      0
    );

    setEvacuationEvacuated(
      Number.isFinite(evacuatedValue) &&
      evacuatedValue >= 0
        ? evacuatedValue
        : 0
    );

    setEvacuationCapacity(
      Number.isFinite(capacityValue) &&
      capacityValue >= 0
        ? capacityValue
        : 0
    );

  } catch (error) {
    console.error(
      'Live dashboard summary error:',
      error
    );

    // Never fall back to fake numbers.
    setInfraData(EMPTY_INFRA_DATA);
    setSupportUnits([]);
    setEvacuationEvacuated(0);
    setEvacuationCapacity(0);

  } finally {
    setDashboardLoading(false);
  }
};


// ============================================================
// FETCH SUPPORT UNITS
// ============================================================

const fetchSupportUnits = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/support-units`
    );

    if (!response.ok) {
      throw new Error(
        `Support API returned ${response.status}`
      );
    }

    const data = await response.json();

    const units = Array.isArray(data.units)
      ? data.units
          .map(
            (item: any) =>
              [
                String(
                  item.name ??
                  item.label ??
                  ''
                ),
                Number(
                  item.available ??
                  item.value ??
                  item.count ??
                  0
                ),
              ] as SupportUnitRow
          )
          .filter(
            ([name, value]) =>
              name &&
              Number.isFinite(value)
          )
      : [];

    setSupportUnits(units);

  } catch (error) {
    console.error(
      'Support units API error:',
      error
    );

    setSupportUnits([]);
  }
};


// ============================================================
// LOAD LIVE DATA + REFRESH EVERY 5 MINUTES
// ============================================================

useEffect(() => {
  fetchLiveData();
  fetchDashboardData();
  fetchSupportUnits();

  const interval = window.setInterval(() => {
    fetchLiveData();
    fetchDashboardData();
    fetchSupportUnits();
  }, 5 * 60 * 1000);

  return () => {
    window.clearInterval(interval);
  };
}, []);
  //=======================================================
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
    <>
      {showStart && (
        <StartSequence
          onComplete={() => setShowStart(false)}
        />
      )}

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

          <span className={`live-dot ${loading ? 'updating' : ''}`} />

          <span className="live-status">
            {loading ? 'UPDATING' : 'LIVE MONITORING'}
          </span>

          <span className="topbar-location">
            {selectedLocation?.name || "NORTH-EAST INDIA"}
          </span>

        </div>

        <div className="top-actions">
          <button title="Alerts">
            ◉
          </button>

          <button title="Layers">
            ▱
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
    RISK LEGEND
  </div>

  <div className="legend-row">
    <span className="legend-dot critical" />
    <span>
      <strong>CRITICAL</strong>
      <small>Risk ≥ 85</small>
    </span>
  </div>

  <div className="legend-row">
    <span className="legend-dot high" />
    <span>
      <strong>HIGH</strong>
      <small>Risk 70–84</small>
    </span>
  </div>

  <div className="legend-row">
    <span className="legend-dot medium" />
    <span>
      <strong>MEDIUM</strong>
      <small>Risk 40–69</small>
    </span>
  </div>

  <div className="legend-row">
    <span className="legend-dot low" />
    <span>
      <strong>LOW</strong>
      <small>Risk &lt; 40</small>
    </span>
  </div>

  <div className="legend-divider" />

  <button
    className={`layer-option ${
      layer === 'terrain' ? 'active' : ''
    }`}
    onClick={() => setLayer('terrain')}
  >
    <span>▣</span>
    Terrain / satellite
  </button>

  <button
    className={`layer-option ${
      layer === 'street' ? 'active' : ''
    }`}
    onClick={() => setLayer('street')}
  >
    <span>⌁</span>
    Roads & villages
  </button>

</div>

            <div className="panel">
            <EonetPanel />
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


          {/* DATA REGISTRATION */}

          <div className="panel links-panel">

            <div className="panel-title centered">
              NER GOVERNMENT HELPLINES
              <span className="panel-status">OFFICIAL</span>
            </div>

            <div className="registration-list">

              <a
                className="link-item"
                href="https://necouncil.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="link-index">01</span>
                <span className="link-icon">▣</span>

                <span className="link-copy">
                  <strong>North Eastern Council</strong>
                  <small>Government of India · NER coordination</small>
                </span>

                <span className="link-arrow">↗</span>
              </a>

              <a
                className="link-item"
                href="https://mdoner.gov.in/contactus"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="link-index">02</span>
                <span className="link-icon">☎</span>

                <span className="link-copy">
                  <strong>MDoNER — Contact / Assistance</strong>
                  <small>Ministry of Development of North Eastern Region</small>
                </span>

                <span className="link-arrow">↗</span>
              </a>

              <a
                className="link-item"
                href="https://services.india.gov.in/service/detail/grievance-redressal-development-of-north-eastern-region-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="link-index">03</span>
                <span className="link-icon">⚠</span>

                <span className="link-copy">
                  <strong>NER Government Grievance</strong>
                  <small>Official grievance redressal service</small>
                </span>

                <span className="link-arrow">↗</span>
              </a>

            </div>

            <div className="registration-footer">
              <span className="registration-dot"></span>
              <span>Official Government of India resources</span>
              <span className="registration-live">LIVE LINK</span>
            </div>

          </div>

        </aside>


        {/* ====================================================
            MAP
        ==================================================== */}

        <section className="map-panel">

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

              <div className="severity-chart severity-pie-chart">

                <ResponsiveContainer
                  width="100%"
                  height={150}
                >

                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        background: '#111',
                        border: '1px solid #444',
                        color: '#fff',
                        fontSize: 11,
                      }}
                      formatter={(value: number | string, _name, props) => [
                        value,
                        props?.payload?.name ?? 'Events',
                      ]}
                    />

                    <Pie
                      data={severityData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={68}
                      paddingAngle={2}
                      stroke="#0d0d0d"
                      strokeWidth={2}
                    >
                      {severityData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>
                  </PieChart>

                </ResponsiveContainer>

              </div>


              <div className="severity-cards">

                <SeverityCard
                  color="#e20d0d"
                  icon="⚠"
                  value={String(
                    severityData[0].value
                  )}
                  label="CRITICAL"
                />

                <SeverityCard
                  color="#ff9f00"
                  icon="⚠"
                  value={String(
                    severityData[1].value
                  )}
                  label="HIGH"
                />

                <SeverityCard
                  color="#fff000"
                  icon="⚠"
                  value={String(
                    severityData[2].value
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
    top: 5,
    bottom: 3,
  }}
>
              

                <CartesianGrid
                  stroke="#2d2d2d"
                  horizontal={false}
                />

               <XAxis
  type="number"
  domain={[
    0,
    Math.max(
      1,
      Math.ceil(
        Math.max(
          ...infraData.map((item) => item.value)
        ) * 1.15
      )
    ),
  ]}
  stroke="#666"
  tick={{
    fontSize: 8,
  }}
  allowDecimals={false}
/>

<YAxis
  type="category"
  dataKey="name"
  stroke="#aaa"
  tick={{
    fontSize: 9,
  }}
  width={62}
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

                  {infraData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.name.toLowerCase().includes('severe')
                          ? '#ff1717'
                          : entry.name.toLowerCase().includes('moderate')
                            ? '#ff9f00'
                            : entry.name.toLowerCase().includes('minor')
                              ? '#fff000'
                              : '#51e800'
                      }
                    />
                  ))}

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
                <span className="panel-status">LIVE</span>
              </div>

              <div className="evacuation-content">

                <div className="evacuation-number">
                  <strong>
                    {evacuationEvacuated.toLocaleString()}
                  </strong>
                  <span>PEOPLE EVACUATED</span>
                </div>

                <div className="evacuation-progress">
                  <div
                    className="evacuation-progress-fill"
                    style={{
                      width:
                        evacuationCapacity > 0
                          ? `${Math.min(
                              (evacuationEvacuated /
                                evacuationCapacity) *
                                100,
                              100
                            )}%`
                          : '0%',
                    }}
                  />
                </div>

                <div className="evacuation-meta">
                  <span>
                    {evacuationEvacuated.toLocaleString()} evacuated
                  </span>
                  <span>
                    {evacuationCapacity.toLocaleString()} capacity
                  </span>
                </div>

                <div className="evacuation-status">
                  <span className="evacuation-status-dot" />
                  LIVE EVACUATION MONITORING
                </div>

              </div>

              <div className="update-note">
                {dashboardLoading
                  ? 'Updating live data...'
                  : 'Live backend data'}
              </div>

            </div>


            {/* SUPPORT */}

            <div className="panel support-panel">

              <div className="panel-title">
                AVAILABLE SUPPORT UNITS
              </div>

              {supportUnits.length > 0 ? (
                supportUnits.map(([name, value]) => (
                  <div
                    className="support-row"
                    key={name}
                  >
                    <span className="support-icon">
                      ✚
                    </span>
                    <span>{name}</span>
                    <b>{value}</b>
                  </div>
                ))
              ) : (
                <div className="update-note">
                  Live support-unit data unavailable.
                </div>
              )}

              <div className="update-note right">
                {dashboardLoading ? 'Updating live data...' : 'Live backend data'}
              </div>

            </div>

          </div>


          {/* SELECTED LOCATION */}

          {selected && (

            <div className="panel details-panel">

                            <div className="panel-title">
                SELECTED LOCATION
              </div>

              <select
                className="location-select"
                value={selected.id}
                onChange={(event) =>
                  setSelectedId(Number(event.target.value))
                }
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>

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
    </>
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
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}


export default App;