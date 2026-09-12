import React, { useEffect, useState } from 'react';

type NasaEvent = {
  id: string;
  title?: string;
  description?: string;
  link?: string;
  categories?: {
    id?: string;
    title?: string;
  }[];
  geometry?: {
    type?: string;
    coordinates?: number[];
    date?: string;
  }[];
};

const NASA_EONET_URL =
  'https://eonet.gsfc.nasa.gov/api/v3/events/geojson' +
  '?category=landslides' +
  '&status=all' +
  '&days=30' +
  '&bbox=87,29,90,25';

function EonetPanel() {
  const [events, setEvents] = useState<NasaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);

        const response = await fetch(NASA_EONET_URL);

        if (!response.ok) {
          throw new Error(
            `NASA EONET returned ${response.status}`
          );
        }

        const data = await response.json();

        const nasaEvents =
          Array.isArray(data.features)
            ? data.features
                .map((feature: any) => ({
                  id: feature.id,
                  title:
                    feature.properties?.title ??
                    feature.title ??
                    'Landslide event',
                  description:
                    feature.properties?.description ??
                    feature.description,
                  link:
                    feature.properties?.link ??
                    feature.link,
                  categories:
                    feature.properties?.categories ??
                    feature.categories,
                  geometry: feature.geometry
                    ? [
                        {
                          type: feature.geometry.type,
                          coordinates:
                            feature.geometry.coordinates,
                          date:
                            feature.properties?.date ??
                            feature.geometry?.date,
                        },
                      ]
                    : [],
                }))
                .sort((a: NasaEvent, b: NasaEvent) => {
                  const dateA =
                    a.geometry?.[0]?.date
                      ? new Date(
                          a.geometry[0].date
                        ).getTime()
                      : 0;

                  const dateB =
                    b.geometry?.[0]?.date
                      ? new Date(
                          b.geometry[0].date
                        ).getTime()
                      : 0;

                  return dateB - dateA;
                })
                .slice(0, 4)
            : [];

        setEvents(nasaEvents);
      } catch (error) {
        console.error(
          'NASA EONET news error:',
          error
        );

        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();

    const interval = window.setInterval(
      fetchNews,
      5 * 60 * 1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="eonet-news">
      {/* HEADER */}
      <div className="eonet-news-header">
        <div>
          <span className="news-live-dot" />
          <strong>NER LANDSLIDE NEWS</strong>
        </div>

        
      </div>

      {/* LOADING */}
      {loading && (
        <div className="news-status">
          Fetching latest NASA events...
        </div>
      )}

      {/* NO EVENTS */}
{!loading && events.length === 0 && (
  <div className="eonet-empty">

    <div className="eonet-gov-heading">
      LATEST GOVERNMENT UPDATES
    </div>

    <a
  className="eonet-gov-link"
  href="https://www.sikkim.gov.in/media/news-announcement/news-info?name=SDM+Chungthang+Inspects+Originating+Point+of+Landslide+at+Chakung+Chu"
  target="_blank"
  rel="noopener noreferrer"
>
  <span className="eonet-status monitoring"></span>

  <span className="eonet-gov-copy">
    <strong>Chungthang</strong>
    <small>Inspection of recent Chakung Chu landslide zone</small>
  </span>

  <span className="eonet-gov-meta">
     Government of Sikkim
  </span>

  <span className="eonet-arrow">↗</span>
</a>

  </div>
)}

      {/* NEWS */}
      {!loading &&
        events.map((event) => {
          const date =
            event.geometry?.[0]?.date;

          return (
            <div
              className="news-item"
              key={event.id}
            >
              <span className="news-marker">
                ●
              </span>

              <div className="news-content">
                <strong>
                  {event.title}
                </strong>

                <small>
                  {date
                    ? new Date(
                        date
                      ).toLocaleDateString(
                        'en-IN',
                        {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }
                      )
                    : 'Recent event'}
                </small>
              </div>

              {event.link && (
                <a
                  href={event.link}
                  target="_blank"
                  rel="noreferrer"
                  className="news-link"
                  title="Open NASA event"
                >
                  ↗
                </a>
              )}
            </div>
          );
        })}
    </div>
  );
}

export default EonetPanel;