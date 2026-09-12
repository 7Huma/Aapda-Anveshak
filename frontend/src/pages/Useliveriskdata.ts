import { useEffect, useState } from 'react';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export type Location = {
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

// Used only while the live API is loading, or if it fails entirely.
const initialLocations: Location[] = [
  { id: 101, name: 'Sikkim North', lat: 27.62, lng: 88.71, risk: 94, level: 'CRITICAL', rainfall: 242, soil: 91, slope: 48, elevation: 2100 },
  { id: 102, name: 'Gangtok East', lat: 27.33, lng: 88.61, risk: 87, level: 'HIGH', rainfall: 180, soil: 82, slope: 42, elevation: 1850 },
  { id: 103, name: 'Darjeeling Hills', lat: 27.04, lng: 88.26, risk: 78, level: 'HIGH', rainfall: 165, soil: 79, slope: 39, elevation: 1650 },
  { id: 104, name: 'West Sikkim', lat: 27.25, lng: 88.22, risk: 61, level: 'MEDIUM', rainfall: 124, soil: 68, slope: 31, elevation: 1500 },
  { id: 105, name: 'Kalimpong', lat: 27.07, lng: 88.47, risk: 34, level: 'MEDIUM', rainfall: 93, soil: 54, slope: 26, elevation: 1250 },
  { id: 106, name: 'South Sikkim', lat: 27.17, lng: 88.43, risk: 19, level: 'LOW', rainfall: 58, soil: 39, slope: 18, elevation: 980 },
  { id: 107, name: 'Teesta Valley', lat: 27.55, lng: 88.65, risk: 84, level: 'HIGH', rainfall: 171, soil: 84, slope: 45, elevation: 1720 },
  { id: 108, name: 'Rangpo', lat: 27.18, lng: 88.53, risk: 46, level: 'MEDIUM', rainfall: 111, soil: 61, slope: 29, elevation: 890 },
];

/**
 * Fetches live risk data from the backend, refreshing every 5 minutes.
 * Shared by Dashboard and RiskMap so there's exactly one fetch/interval
 * running per mounted page, instead of every page duplicating this logic.
 */
export function useLiveRiskData() {
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLiveData() {
      try {
        setLoading(true);

        const response = await fetch(`${API_BASE_URL}/api/risk/live`);

        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();

        if (!data.locations || !Array.isArray(data.locations)) {
          throw new Error('Invalid response from backend');
        }

        // Keep only locations where the ML/backend actually
        // returned a numeric risk score.
        const validLocations = data.locations.filter(
          (location: Location) => typeof location.risk === 'number'
        );

        if (!cancelled) {
          if (validLocations.length > 0) {
            setLocations(validLocations);
          }
          setLastUpdated(data.updated_at ?? null);
          setApiError('');
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Live risk API error:', error);
          setApiError('Unable to connect to Earth Engine backend');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLiveData();
    const interval = window.setInterval(fetchLiveData, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const avgRisk =
    locations.length > 0
      ? Math.round(
          locations.reduce((total, location) => total + location.risk, 0) /
            locations.length
        )
      : 0;

  const severityData = [
    {
      name: 'Critical',
      value: locations.filter((x) => x.level === 'CRITICAL').length,
      color: '#ff1717',
    },
    {
      name: 'High',
      value: locations.filter((x) => x.level === 'HIGH').length,
      color: '#ff9f00',
    },
    {
      name: 'Medium',
      value: locations.filter((x) => x.level === 'MEDIUM').length,
      color: '#fff000',
    },
    {
      name: 'Low',
      value: locations.filter((x) => x.level === 'LOW').length,
      color: '#51e800',
    },
  ];

  return { locations, loading, apiError, lastUpdated, avgRisk, severityData };
}

export const riskColor = (level: string) => {
  if (level === 'CRITICAL') return '#ff1717';
  if (level === 'HIGH') return '#ff9f00';
  if (level === 'MEDIUM') return '#fff000';
  return '#51e800';
};
