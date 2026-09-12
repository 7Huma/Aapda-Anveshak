import React from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";



type RiskLocation = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  risk: number;
  level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
};

const locations: RiskLocation[] = [
  {
    id: 101,
    name: "Sikkim North",
    lat: 27.62,
    lng: 88.71,
    risk: 94,
    level: "CRITICAL",
  },
  {
    id: 102,
    name: "Gangtok East",
    lat: 27.33,
    lng: 88.61,
    risk: 87,
    level: "HIGH",
  },
  {
    id: 103,
    name: "Darjeeling Hills",
    lat: 27.04,
    lng: 88.26,
    risk: 78,
    level: "HIGH",
  },
  {
    id: 104,
    name: "West Sikkim",
    lat: 27.25,
    lng: 88.22,
    risk: 61,
    level: "MEDIUM",
  },
  {
    id: 105,
    name: "Kalimpong",
    lat: 27.07,
    lng: 88.47,
    risk: 34,
    level: "LOW",
  },
  {
    id: 106,
    name: "South Sikkim",
    lat: 27.17,
    lng: 88.43,
    risk: 19,
    level: "LOW",
  },
  {
    id: 107,
    name: "Teesta Valley",
    lat: 27.55,
    lng: 88.65,
    risk: 84,
    level: "HIGH",
  },
  {
    id: 108,
    name: "Rangpo",
    lat: 27.18,
    lng: 88.53,
    risk: 46,
    level: "MEDIUM",
  },
];

const riskColor = (level: RiskLocation["level"]) => {
  switch (level) {
    case "CRITICAL":
      return "#ff3038";
    case "HIGH":
      return "#ff7200";
    case "MEDIUM":
      return "#f2b400";
    case "LOW":
      return "#00bd5b";
  }
};

/*
 * Forces Leaflet to recalculate its size after the page
 * becomes visible. This prevents the "small map tiles"
 * problem you had earlier.
 */
function MapResize() {
  const map = useMap();

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

export default function RiskMap() {
  const center: LatLngExpression = [27.33, 88.48];

  return (
    <div className="risk-map-page">

      {/* HEADER */}
      <div className="risk-map-top">

        <div className="risk-map-heading">
          <h1>Risk Map</h1>

          <p>
            Geographic visualization of landslide risk across the
            North Eastern Region.
          </p>
        </div>

        <div className="risk-map-actions">

          <button className="help-button">
            <span>?</span>
            Help Desk
          </button>

          <button className="language-button">
            <span>◎</span>
            English
            <span className="language-arrow">⌄</span>
          </button>

        </div>

      </div>

      {/* LEGEND */}
      <div className="risk-map-legend">

        <strong>Risk Level:</strong>

        <div className="risk-legend-item">
          <span className="risk-dot critical" />
          Critical
        </div>

        <div className="risk-legend-item">
          <span className="risk-dot high" />
          High
        </div>

        <div className="risk-legend-item">
          <span className="risk-dot medium" />
          Moderate
        </div>

        <div className="risk-legend-item">
          <span className="risk-dot low" />
          Low
        </div>

      </div>

      {/* MAP */}
      <div className="risk-map-wrapper">

        <MapContainer
          center={center}
          zoom={7}
          zoomControl={false}
          className="risk-map-full"
        >

          <MapResize />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ZoomControl position="topleft" />

          {locations.map((location) => {
            const color = riskColor(location.level);

            return (
              <React.Fragment key={location.id}>

                {/* RISK AREA */}
                <Circle
                  center={[
                    location.lat,
                    location.lng,
                  ]}
                  radius={location.risk * 180}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.08,
                    weight: 1,
                  }}
                />

                {/* LOCATION MARKER */}
                <CircleMarker
                  center={[
                    location.lat,
                    location.lng,
                  ]}
                  radius={11}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 3,
                    fillColor: color,
                    fillOpacity: 1,
                  }}
                >

                  <Popup>

                    <div className="risk-popup">

                      <strong>
                        {location.name}
                      </strong>

                      <span
                        style={{
                          color,
                          fontWeight: 700,
                        }}
                      >
                        {location.level}
                      </span>

                      <small>
                        Risk Score:{" "}
                        <b>{location.risk}/100</b>
                      </small>

                    </div>

                  </Popup>

                </CircleMarker>

              </React.Fragment>
            );
          })}

        </MapContainer>

        {/* BOTTOM LEGEND */}
        <div className="map-bottom-legend">

          <span>
            <i className="risk-dot critical" />
            Critical
          </span>

          <span>
            <i className="risk-dot high" />
            High
          </span>

          <span>
            <i className="risk-dot medium" />
            Medium
          </span>

          <span>
            <i className="risk-dot low" />
            Low
          </span>

        </div>

      </div>

    </div>
  );
}