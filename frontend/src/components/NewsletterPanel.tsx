import { useEffect, useState } from 'react';


type EonetEvent = {
  id: string;
  title: string;
  link: string;
  categories: { id: string; title: string }[];
  geometry: { date: string; coordinates: number[] }[];
};

// Rough bounding box covering NER + surrounding Himalayan belt
// (South Asia broadly), so region-relevant events sort to the top.
const NER_BBOX = { minLat: 20, maxLat: 32, minLng: 82, maxLng: 98 };

function isInRegion(lng: number, lat: number) {
  return (
    lat >= NER_BBOX.minLat &&
    lat <= NER_BBOX.maxLat &&
    lng >= NER_BBOX.minLng &&
    lng <= NER_BBOX.maxLng
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NewsletterPanel() {
  const [events, setEvents] = useState<EonetEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(
          'https://eonet.gsfc.nasa.gov/api/v3/events?category=landslides&status=open&limit=20'
        );
        if (!res.ok) throw new Error(`EONET returned ${res.status}`);
        const data = await res.json();

        if (!cancelled) {
          setEvents(data.events ?? []);
          setError('');
          setLastChecked(new Date());
        }
      } catch (err) {
        if (!cancelled) {
          console.error('EONET fetch failed:', err);
          setError('Unable to reach NASA EONET right now.');
          setLastChecked(new Date());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = window.setInterval(load, 15 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  // Sort so region-relevant events (NER / South Asia) show first.
  const sorted = [...events].sort((a, b) => {
    const aCoord = a.geometry[a.geometry.length - 1]?.coordinates;
    const bCoord = b.geometry[b.geometry.length - 1]?.coordinates;
    const aInRegion = aCoord ? isInRegion(aCoord[0], aCoord[1]) : false;
    const bInRegion = bCoord ? isInRegion(bCoord[0], bCoord[1]) : false;
    if (aInRegion && !bInRegion) return -1;
    if (!aInRegion && bInRegion) return 1;
    return 0;
  });

  const [lead, ...rest] = sorted;

  const renderRegionBadge = (inRegion: boolean) => (
    <span
      className={`news-region-badge${
        inRegion ? ' news-region-badge--local' : ''
      }`}
    >
      {inRegion ? 'NEAR NER' : 'GLOBAL'}
    </span>
  );

  return (
    <div className="news-panel">
      {/* MASTHEAD */}
      <div className="news-masthead">
        <div className="news-masthead-top">
          <span className="news-kicker">LIVE WIRE</span>
          <span className="news-source-tag">via NASA EONET</span>
        </div>
        <h2 className="news-title">The NER Landslide Bulletin</h2>
        <div className="news-rule" />
        <div className="news-masthead-sub">
          {lastChecked
            ? `Last checked ${formatTime(lastChecked)}`
            : 'Checking latest wire…'}
        </div>
      </div>

      {/* BODY */}
      <div className="news-body">
        {loading && !lastChecked && (
          <div className="news-empty">Loading latest events…</div>
        )}

        {!loading && error && sorted.length === 0 && (
          <div className="news-empty news-empty--error">{error}</div>
        )}

        {!loading && !error && sorted.length === 0 && (
          <div className="news-empty">
            No open landslide events reported globally right now.
          </div>
        )}

        {lead && (
          <a
            href={lead.link}
            target="_blank"
            rel="noopener noreferrer"
            className="news-lead"
          >
            <span className="news-lead-tag">TOP STORY</span>
            <div className="news-lead-title">{lead.title}</div>
            <div className="news-lead-meta">
              {renderRegionBadge(
                isInRegion(
                  lead.geometry[lead.geometry.length - 1]?.coordinates[0] ?? 0,
                  lead.geometry[lead.geometry.length - 1]?.coordinates[1] ?? 0
                )
              )}
              {lead.geometry[lead.geometry.length - 1] && (
                <span className="news-date">
                  {formatDate(lead.geometry[lead.geometry.length - 1].date)}
                </span>
              )}
            </div>
          </a>
        )}

        {rest.length > 0 && (
          <ul className="news-list">
            {rest.slice(0, 5).map((event) => {
              const latest = event.geometry[event.geometry.length - 1];
              const coord = latest?.coordinates;
              const inRegion = coord ? isInRegion(coord[0], coord[1]) : false;

              return (
                <li key={event.id} className="news-row">
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="news-row-link"
                  >
                    <span className="news-row-title">{event.title}</span>
                    <span className="news-row-meta">
                      {renderRegionBadge(inRegion)}
                      {latest && (
                        <span className="news-date">
                          {formatDate(latest.date)}
                        </span>
                      )}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="news-footer">
        Refreshes every 15 minutes · Source events are self-reported and
        may lag real-time ground conditions.
      </div>
    </div>
  );
}

export default NewsletterPanel;