# SIH 26001 — Landslide Risk Monitoring Dashboard

A frontend-first React + TypeScript dashboard closely matching the supplied reference dashboard. It is intentionally powered by mock data so frontend work can proceed before the FastAPI/PostgreSQL/ML backend is ready.

## Run

```bash
npm install
npm run dev
```

## What is included

- Dark operations dashboard matching the reference layout
- Left legend, estimated affected summary and field-report links
- Central interactive Leaflet map with terrain/street layer toggle
- Risk zones and clickable location markers
- Verified risk events chart + severity cards
- Infrastructure impact chart
- Evacuation gauge
- Available support units
- Selected-location risk details
- Mock risk data structured for later API integration

## Backend integration

Replace the mock `locations` data in `src/App.tsx` with calls to your FastAPI service. Keep the same fields:

```json
{
  "location_id": 101,
  "risk_score": 87,
  "risk_level": "HIGH",
  "confidence": 0.91,
  "latitude": 27.33,
  "longitude": 88.61
}
```

The UI does not need to be redesigned when the backend becomes available.
