import React, { useMemo, useState } from "react";


/* =========================================
   TYPES
========================================= */

type Status = "ACTIVE" | "MONITORING" | "FORECAST";

type AlertItem = {
  id: number;
  location: string;
  district: string;
  status: Status;
  title: string;
  summary: string;
  date: string;
  source: string;
  url: string;
};

/* =========================================
   ALERT DATA
========================================= */

const alerts: AlertItem[] = [
  {
    id: 1,
    location: "Mangan",
    district: "Sikkim",
    status: "MONITORING",
    title: "Landslide near Teesta–Chyakoong confluence",
    summary:
      "A landslide near Naga–Tosa Road partially obstructed river flow. The district administration reported normal river flow after assessment and continued 24/7 monitoring of the river belt and slope.",
    date: "06 Sep 2026",
    source:
      "Government of Sikkim · District Administration, Mangan",
    url: "https://www.sikkim.gov.in/media/press-release/press-info?id=165645",
  },

  {
    id: 2,
    location: "Chungthang",
    district: "Sikkim",
    status: "MONITORING",
    title: "Inspection of recent Chakung Chu landslide zone",
    summary:
      "Officials inspected the landslide origin to assess slope stability, possible further movement and impacts on road connectivity, with close monitoring directed for vulnerable areas.",
    date: "08 Sep 2026",
    source:
      "Government of Sikkim · Chungthang Administration",
    url: "https://www.sikkim.gov.in/media/news-announcement/news-info?name=SDM+Chungthang+Inspects+Originating+Point+of+Landslide+at+Chakung+Chu",
  },

  {
    id: 3,
    location: "Rimbi",
    district: "Gyalshing, Sikkim",
    status: "ACTIVE",
    title: "Landslide disrupted road connectivity",
    summary:
      "A major landslide damaged the Geyzing–Pelling–Yuksom route and disrupted connectivity to the 72nd Battalion SSB Headquarters. District and response agencies conducted a joint inspection.",
    date: "02 Sep 2026",
    source:
      "Government of Sikkim · Gyalshing Administration",
    url: "https://www.sikkim.gov.in/media/press-release/press-info?id=165627",
  },

  {
    id: 4,
    location: "Rimbi–Singlitam",
    district: "Gyalshing, Sikkim",
    status: "ACTIVE",
    title: "Active landslide and precautionary evacuation",
    summary:
      "The administration reported continuing landslide movement, identified vulnerable households and initiated evacuation and temporary shelter arrangements for affected and at-risk families.",
    date: "15 Aug 2026",
    source:
      "Government of Sikkim · Gyalshing Administration",
    url: "https://www.sikkim.gov.in/media/press-release/press-info?id=165550",
  },

  {
    id: 5,
    location: "Darjeeling · Kalimpong",
    district: "West Bengal",
    status: "FORECAST",
    title: "Operational landslide forecast bulletins",
    summary:
      "GSI's National Landslide Forecasting Centre issues operational landslide forecast bulletins for Darjeeling and Kalimpong through the Bhusanket portal.",
    date: "GSI forecast service",
    source:
      "Geological Survey of India · NLFC",
    url: "https://bhusanket.gsi.gov.in/",
  },
];

/* =========================================
   STATUS LABELS
========================================= */

const labels: Record<Status, string> = {
  ACTIVE: "ACTIVE INCIDENT",
  MONITORING: "MONITORING",
  FORECAST: "FORECAST",
};

/* =========================================
   ALERTS COMPONENT
========================================= */

export default function Alerts() {
  const [filter, setFilter] =
    useState<"ALL" | Status>("ALL");

  const [zoom, setZoom] = useState(1);

  /* =========================================
     COUNTS
  ========================================= */

  const counts = useMemo(
    () => ({
      active: alerts.filter(
        (a) => a.status === "ACTIVE"
      ).length,

      monitoring: alerts.filter(
        (a) => a.status === "MONITORING"
      ).length,

      forecast: alerts.filter(
        (a) => a.status === "FORECAST"
      ).length,
    }),
    []
  );

  /* =========================================
     FILTERED ALERTS
  ========================================= */

  const visible =
    filter === "ALL"
      ? alerts
      : alerts.filter(
          (a) => a.status === filter
        );

  /* =========================================
     UI
  ========================================= */

  return (
    <main
      className="alerts-screen"
      style={{
        zoom: zoom,
      }}
    >
      {/* =====================================
          HEADER
      ===================================== */}

      <header className="alerts-header">
        <div>
          <div className="alerts-eyebrow">
            <i />
            GOVERNMENT-SOURCED DISASTER INTELLIGENCE
          </div>

          <h1>Risk Alerts</h1>

          <p>
            Official landslide incidents, monitoring
            updates and forecast services relevant to
            the North Eastern Region.
          </p>
        </div>

        <div className="alerts-header-actions">
          {/* PAGE ZOOM */}

          <div className="page-zoom-controls">
            <button
              type="button"
              onClick={() =>
                setZoom((z) =>
                  Math.min(z + 0.1, 1.5)
                )
              }
            >
              +
            </button>

            <span>
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={() =>
                setZoom((z) =>
                  Math.max(z - 0.1, 0.8)
                )
              }
            >
              −
            </button>

            <button
              type="button"
              onClick={() => setZoom(1)}
            >
              Reset
            </button>
          </div>

          {/* GSI BUTTON */}

          <a
            className="alerts-gsi-button"
            href="https://bhusanket.gsi.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
          >
            GSI FORECAST PORTAL <span>↗</span>
          </a>
        </div>
      </header>

      {/* =====================================
          OVERVIEW
      ===================================== */}

      <section className="alerts-overview">
        <div className="overview-card active">
          <b>!</b>

          <div>
            <small>ACTIVE INCIDENTS</small>

            <strong>{counts.active}</strong>

            <span>
              Government-reported incidents
            </span>
          </div>
        </div>

        <div className="overview-card monitoring">
          <b>◒</b>

          <div>
            <small>UNDER MONITORING</small>

            <strong>{counts.monitoring}</strong>

            <span>
              Assessment / surveillance
            </span>
          </div>
        </div>

        <div className="overview-card forecast">
          <b>◌</b>

          <div>
            <small>FORECAST SERVICE</small>

            <strong>{counts.forecast}</strong>

            <span>
              Official GSI coverage
            </span>
          </div>
        </div>

        <div className="overview-card sources">
          <b>✓</b>

          <div>
            <small>OFFICIAL ITEMS</small>

            <strong>{alerts.length}</strong>

            <span>
              Verified source entries
            </span>
          </div>
        </div>
      </section>

      {/* =====================================
          OFFICIAL SOURCE STRIP
      ===================================== */}

      <section className="official-strip">
        <div className="gov-mark">
          GOV
        </div>

        <div>
          <strong>
            Official sources only
          </strong>

          <span>
            Government of Sikkim district updates ·
            Geological Survey of India NLFC
          </span>
        </div>

        <em>
          <i />
          SOURCE VERIFIED
        </em>
      </section>

      {/* =====================================
          ALERT CONTENT
      ===================================== */}

      <section className="alerts-content">
        {/* SECTION HEADER */}

        <div className="alerts-section-head">
          <div>
            <small>FIELD UPDATES</small>

            <h2>
              Government Risk Updates
            </h2>
          </div>

          <nav>
            {(
              [
                "ALL",
                "ACTIVE",
                "MONITORING",
                "FORECAST",
              ] as const
            ).map((x) => (
              <button
                type="button"
                key={x}
                className={
                  filter === x
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setFilter(x)
                }
              >
                {x === "ALL"
                  ? "ALL UPDATES"
                  : labels[x]}
              </button>
            ))}
          </nav>
        </div>

        {/* ALERT FEED */}

        <div className="alert-feed">
          {visible.map((a, i) => (
            <article
              className={`government-alert-card ${a.status.toLowerCase()}`}
              key={a.id}
            >
              <div className="alert-number">
                {String(i + 1).padStart(2, "0")}
              </div>

              <div className="alert-main">
                <div className="alert-top">
                  <div className="location">
                    <strong>
                      {a.location}
                    </strong>

                    <span>
                      {a.district}
                    </span>
                  </div>

                  <label>
                    <i />
                    {labels[a.status]}
                  </label>
                </div>

                <h3>{a.title}</h3>

                <p>{a.summary}</p>

                <footer>
                  <span>
                    <b>DATE</b>
                    {a.date}
                  </span>

                  <span className="source">
                    <b>SOURCE</b>
                    {a.source}
                  </span>

                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    VIEW OFFICIAL UPDATE ↗
                  </a>
                </footer>
              </div>
            </article>
          ))}
        </div>

        {/* INFORMATION NOTE */}

        <div className="alerts-note">
          <b>ⓘ</b>

          <span>
            Government status is displayed
            separately from the system's AI
            prediction. Official incidents and
            monitoring notices are not converted
            into an AI risk score.
          </span>
        </div>
      </section>

      {/* =====================================
          FOOTER
      ===================================== */}

      <footer className="alerts-footer">
        <span>
          AI-BASED EARLY WARNING &amp; LANDSLIDE
          RISK MONITORING SYSTEM
        </span>

        <span>
          LAST REVIEW · 12 SEP 2026
        </span>
      </footer>
    </main>
  );
}