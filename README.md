Aapda Anveshak

AI-Based Early Warning & Landslide Risk Monitoring System

Aapda Anveshak is an AI-powered disaster intelligence and early-warning platform designed to monitor landslide risk across the North Eastern Region (NER) of India.

The system combines geospatial visualization, environmental factors, machine-learning risk assessment, live weather information, verified landslide events, government updates, emergency resources, and field reporting into a single operational dashboard.

Overview

The platform is designed to help authorities, responders, and communities:

Monitor landslide-prone locations across the NER.

Visualize risk levels on an interactive map.

Analyze rainfall, soil moisture, slope, elevation, and snow-cover indicators.

Generate AI/ML-based landslide risk scores and confidence values.

Track verified landslide events and government updates.

View evacuation points and available support units.

Access important government emergency helplines.

Submit and manage field reports.

Support early-warning and emergency-response workflows.

Key Features

🗺️ Interactive Risk Map

Interactive Leaflet-based map.

Location-specific risk visualization.

Risk levels: LOW, MEDIUM, HIGH, CRITICAL.

Selected-location details and environmental indicators.

Map markers for monitored locations.

🤖 AI/ML Risk Assessment

The planned risk-prediction pipeline uses environmental and terrain features such as:

Historical landslide data

Rainfall

Soil moisture

Slope

Elevation

Terrain characteristics

The ML engine produces a risk probability/score, risk level, and model confidence.

Example API result:

{
  "location_id": 101,
  "risk_score": 87,
  "risk_level": "HIGH",
  "confidence": 0.91
}

🌧️ Live Environmental Monitoring

The dashboard can display environmental indicators including:

Rainfall

Soil moisture

Slope

Elevation

Snow cover

ML confidence

🛰️ NASA EONET Integration

NASA EONET event information is used to surface relevant natural-event information.

The dashboard also provides recent government updates when no relevant recent EONET landslide event is available for the selected region.

🚨 Alerts & Early Warning

The platform supports risk/event monitoring through:

Active alerts

Monitoring updates

Forecast information

Verified risk events

Government disaster-management updates

🏥 Emergency Resources

The dashboard provides access to:

Government emergency helplines

Evacuation points

Emergency administration

Fire & rescue

Armed forces

Police/support resources

📋 Field Reports

Field-report workflows allow observations from affected areas to be incorporated into the monitoring system.

📱 Responsive Interface

The dashboard is designed for:

Desktop browsers

Laptops

Tablets

Mobile screens

System Architecture

┌───────────────────────────────────────────────┐
│              AAPDA ANVESHAK                   │
│      AI-Based Disaster Intelligence           │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│          React + TypeScript Frontend          │
│                                               │
│  Dashboard │ Risk Map │ Alerts │ Reports     │
│  Weather   │ EONET    │ Resources            │
└───────────────────────┬───────────────────────┘
                        │ REST APIs
                        ▼
┌───────────────────────────────────────────────┐
│                FastAPI Backend                │
│                                               │
│  Risk APIs │ Reports │ Weather │ Alerts       │
│  Support Units │ Data Processing              │
└───────────────┬───────────────────┬───────────┘
                │                   │
                ▼                   ▼
┌──────────────────────┐   ┌────────────────────┐
│ PostgreSQL / PostGIS │   │ Python ML Engine    │
│                      │   │                    │
│ Geospatial Data      │   │ Risk Prediction    │
│ Locations & Reports  │   │ Risk Scoring       │
└──────────────────────┘   │ Confidence         │
                           └─────────┬──────────┘
                                     │
                                     ▼
                           ┌────────────────────┐
                           │   Alert Engine     │
                           │                    │
                           │ Early Warning      │
                           │ Response Support   │
                           └────────────────────┘

ML Risk Prediction Flow

Historical Landslide Data
          +
Rainfall
          +
Soil Moisture
          +
Slope
          +
Elevation
          +
Terrain
          │
          ▼
   Data Cleaning
          │
          ▼
 Feature Engineering
          │
          ▼
 XGBoost / Random Forest
          │
          ▼
   Risk Probability
          │
          ▼
      Risk Level
          │
    ┌─────┼─────┬──────────┐
    ▼     ▼     ▼          ▼
   LOW  MEDIUM HIGH     CRITICAL

Technology Stack

Frontend

React

TypeScript

Vite

React Leaflet / Leaflet

Recharts

Responsive CSS

Backend

Python

FastAPI

REST APIs

Uvicorn

AI / ML

Python

Pandas

NumPy

Scikit-learn

XGBoost / Random Forest

Database

PostgreSQL

PostGIS

External Data

NASA EONET

Weather/environmental data sources

Government disaster-management updates

Project Structure

Aapda-Anveshak/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
│
├── .gitignore
├── README.md
└── ...

Local Development

Prerequisites

Install:

Python 3.10+

Node.js 18+

npm

Git

Backend Setup

Open PowerShell:

cd "C:\Users\meett\OneDrive\Desktop\26001\backend"

Create/activate the virtual environment:

python -m venv venv
.env\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Start FastAPI:

uvicorn app:app --reload --host 0.0.0.0 --port 8000

Backend:

http://localhost:8000

API documentation:

http://localhost:8000/docs

Frontend Setup

Open another terminal:

cd "C:\Users\meett\OneDrive\Desktop\26001\frontend"

Install dependencies:

npm install

Start the development server:

npm run dev

The frontend will normally be available at:

http://localhost:5173

Environment Variables

For production, configure the frontend API URL:

VITE_API_URL=https://YOUR-BACKEND-URL

For local development, the frontend falls back to:

http://localhost:8000

Do not commit private credentials, API keys, passwords, or secrets to GitHub.

API Endpoints

Current dashboard integrations include endpoints such as:

GET /api/risk/live
GET /api/dashboard/summary
GET /api/support-units

FastAPI automatically provides interactive API documentation at:

/docs

Data & Risk Interpretation

Risk levels are represented as:

Level

Meaning

🟢 LOW

Lower monitored landslide risk

🟡 MEDIUM

Moderate risk requiring monitoring

🟠 HIGH

Elevated risk requiring increased attention

🔴 CRITICAL

Severe risk requiring urgent response

Risk scores and model confidence should be interpreted together with verified field information and official disaster-management sources.

Deployment

Recommended deployment architecture:

GitHub
  │
  ├──► Vercel
  │      └── React + Vite Frontend
  │
  └──► Render
         └── FastAPI Backend

Frontend

Deploy the frontend/ directory to a platform such as Vercel.

Build command:

npm run build

Output directory:

dist

Backend

Deploy the backend/ directory to a platform such as Render.

Build command:

pip install -r requirements.txt

Start command:

uvicorn app:app --host 0.0.0.0 --port $PORT

After deployment, update:

VITE_API_URL=https://YOUR-BACKEND-URL

and configure backend CORS to allow the deployed frontend origin.

Safety & Data Disclaimer

Aapda Anveshak is a disaster-monitoring and decision-support system.

AI/ML predictions should not be treated as a replacement for official warnings, field verification, or decisions by authorized disaster-management authorities.

Government notices, verified events, weather observations, and model predictions should be considered together when assessing a situation.

Hackathon Context

Problem: AI-Based Early Warning & Landslide Risk Monitoring System

Project: Aapda Anveshak

Focus Region: North Eastern Region (NER), India

The platform brings geospatial monitoring, environmental intelligence, AI/ML risk prediction, alerts, field reporting, and emergency-response information together into one operational interface.

Future Enhancements

Real-time IoT sensor integration.

Live rainfall and soil-moisture sensor feeds.

Advanced satellite/remote-sensing analysis.

Automated SMS/push notifications.

More comprehensive PostGIS geospatial analytics.

Production-grade authentication and authorization.

Real-time government/agency data integrations.

Improved ML model training with larger historical datasets.

Offline/PWA support for field teams.

Multilingual emergency interface.

Team

Built for the Smart India Hackathon ecosystem as an AI-powered disaster-risk monitoring and early-warning solution.

License

This project is intended for educational, research, and hackathon development purposes unless otherwise specified by the project owners.
