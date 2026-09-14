# 🌋 Aapda Anveshak

### AI-Powered Early Warning & Landslide Risk Monitoring System

> **Predict. Monitor. Warn. Respond.**

Aapda Anveshak is an **AI-powered disaster intelligence platform** designed to monitor and assess landslide risk across the **North Eastern Region (NER) of India**.

It brings together **AI/ML risk prediction, geospatial visualization, environmental intelligence, live weather information, verified disaster events, government updates, emergency resources, and field reporting** into one unified operational dashboard.

---

## 🚨 The Problem

The North Eastern Region of India is highly vulnerable to:

* 🌧️ Heavy rainfall
* ⛰️ Landslides and slope failures
* 🌊 Flash floods
* 🛣️ Road blockages
* 🏔️ Fragile terrain
* 🏘️ Isolation of remote communities

Traditional disaster monitoring is often **reactive**, making early identification of high-risk areas difficult.

### 💡 Our Solution

**Aapda Anveshak transforms disaster monitoring from reactive response into proactive risk intelligence.**

```text
Environmental Data
       ↓
AI / ML Risk Analysis
       ↓
Risk Score + Confidence
       ↓
LOW → MEDIUM → HIGH → CRITICAL
       ↓
Early Warning & Response Support
```

---

# ✨ Key Features

## 🗺️ Interactive Risk Intelligence Map

Visualize landslide-prone locations through an interactive **Leaflet-based geospatial dashboard**.

* Location-specific risk levels
* Interactive map markers
* Environmental indicators
* Risk classification
* Selected-location intelligence

### Risk Levels

| Level           | Meaning                                     |
| --------------- | ------------------------------------------- |
| 🟢 **LOW**      | Lower monitored landslide risk              |
| 🟡 **MEDIUM**   | Moderate risk requiring monitoring          |
| 🟠 **HIGH**     | Elevated risk requiring increased attention |
| 🔴 **CRITICAL** | Severe risk requiring urgent response       |

---

## 🤖 AI/ML Landslide Risk Assessment

The planned prediction pipeline combines multiple environmental and terrain factors:

* 🌧️ Rainfall
* 💧 Soil moisture
* ⛰️ Slope
* 📍 Elevation
* 🏔️ Terrain characteristics
* 📊 Historical landslide data

The ML engine produces:

```json
{
  "location_id": 101,
  "risk_score": 87,
  "risk_level": "HIGH",
  "confidence": 0.91
}
```

Models include:

**XGBoost / Random Forest / Scikit-learn**

---

## 🌧️ Environmental Intelligence

The dashboard brings critical environmental indicators together:

* Rainfall
* Soil moisture
* Slope
* Elevation
* Snow cover
* ML confidence

This enables responders to understand **why an area is considered risky**, rather than relying only on a single risk number.

---

## 🛰️ NASA EONET Integration

Aapda Anveshak integrates **NASA EONET event information** to surface relevant natural-event intelligence.

When a relevant recent EONET landslide event is unavailable, the dashboard can provide **recent government disaster-management updates** for the selected region.

---

## 🚨 Alerts & Early Warning

The platform supports disaster monitoring through:

* Active alerts
* Forecast information
* Monitoring updates
* Verified risk events
* Government disaster-management updates

The goal is simple:

> **Identify risk earlier → communicate it faster → support better response.**

---

## 🏥 Emergency Response Resources

Quick access to critical response information:

* 📞 Government emergency helplines
* 🚑 Evacuation points
* 🏛️ Emergency administration
* 🚒 Fire & rescue
* 🪖 Armed forces
* 👮 Police and support resources

---

## 📋 Field Reporting

Field teams can submit observations from affected areas.

Field reports can become an additional information source for the monitoring and response workflow.

---

# 🧠 System Architecture

```text
                         ┌──────────────────────┐
                         │   AAPDA ANVESHAK     │
                         │ Disaster Intelligence│
                         └──────────┬───────────┘
                                    │
                                    ▼
                  ┌─────────────────────────────────┐
                  │       React + TypeScript        │
                  │                                 │
                  │ Dashboard • Risk Map • Alerts   │
                  │ Weather • EONET • Reports       │
                  │ Emergency Resources             │
                  └───────────────┬─────────────────┘
                                  │
                              REST APIs
                                  │
                                  ▼
                  ┌─────────────────────────────────┐
                  │          FastAPI Backend         │
                  │                                 │
                  │ Risk APIs • Reports • Weather  │
                  │ Alerts • Support Units          │
                  └───────────────┬─────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
          ┌───────────────────┐       ┌──────────────────┐
          │ PostgreSQL/PostGIS│       │   Python ML      │
          │                   │       │     Engine       │
          │ Geospatial Data   │       │ Risk Prediction  │
          │ Locations         │       │ Risk Scoring     │
          │ Reports           │       │ Confidence       │
          └───────────────────┘       └────────┬─────────┘
                                               │
                                               ▼
                                    ┌────────────────────┐
                                    │    Alert Engine    │
                                    │                    │
                                    │ Early Warning      │
                                    │ Response Support   │
                                    └────────────────────┘
```

---

# 🧪 ML Risk Prediction Pipeline

```text
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
   Terrain Features
          │
          ▼
   Data Preprocessing
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
      Risk Score
          │
          ▼
 ┌────────┼────────┬──────────┐
 ▼        ▼        ▼          ▼
LOW    MEDIUM     HIGH     CRITICAL
```

---

# 🛠️ Technology Stack

### Frontend

| Technology        | Purpose              |
| ----------------- | -------------------- |
| ⚛️ React          | UI development       |
| 🔷 TypeScript     | Type-safe frontend   |
| ⚡ Vite            | Development & build  |
| 🗺️ Leaflet       | Interactive maps     |
| 📍 React Leaflet  | Map integration      |
| 📊 Recharts       | Data visualization   |
| 🎨 Responsive CSS | Responsive interface |

### Backend

| Technology   | Purpose                        |
| ------------ | ------------------------------ |
| 🐍 Python    | Backend & ML ecosystem         |
| ⚡ FastAPI    | REST API framework             |
| 🚀 Uvicorn   | ASGI server                    |
| 🔗 REST APIs | Frontend-backend communication |

### AI / ML

| Technology       | Purpose                     |
| ---------------- | --------------------------- |
| 🐼 Pandas        | Data processing             |
| 🔢 NumPy         | Numerical computing         |
| 🤖 Scikit-learn  | Machine learning            |
| 🚀 XGBoost       | Risk prediction             |
| 🌳 Random Forest | Classification / prediction |

### Database

* 🐘 PostgreSQL
* 🌍 PostGIS

### External Data

* 🛰️ NASA EONET
* 🌦️ Weather / environmental data sources
* 🏛️ Government disaster-management updates

---

# 📁 Project Structure

```text
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
```

---

# 🚀 Getting Started

## Prerequisites

Make sure you have:

* Python 3.10+
* Node.js 18+
* npm
* Git

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/7Huma/Aapda-Anveshak.git

cd Aapda-Anveshak
```

---

# ⚙️ Backend Setup

Open a terminal:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```powershell
.\venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Backend

```text
http://localhost:8000
```

### API Documentation

```text
http://localhost:8000/docs
```

---

# 💻 Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

The frontend will normally run at:

```text
http://localhost:5173
```

---

# 🔐 Environment Variables

For production, configure:

```env
VITE_API_URL=https://YOUR-BACKEND-URL
```

For local development, the frontend can fall back to:

```text
http://localhost:8000
```

> ⚠️ Never commit API keys, passwords, credentials, or other secrets to GitHub.

---

# 🔌 API Endpoints

Example dashboard integrations include:

```http
GET /api/risk/live
GET /api/dashboard/summary
GET /api/support-units
```

FastAPI automatically provides interactive documentation:

```text
/docs
```

---

# 🌍 Deployment Architecture

```text
                   GitHub
                     │
            ┌────────┴────────┐
            ▼                 ▼
         Vercel             Render
            │                 │
            ▼                 ▼
     React + Vite          FastAPI
       Frontend            Backend
            │                 │
            └───────┬─────────┘
                    ▼
             Aapda Anveshak
```

### Frontend

Recommended deployment:

**Vercel**

Build:

```bash
npm run build
```

Output:

```text
dist
```

### Backend

Recommended deployment:

**Render**

Build:

```bash
pip install -r requirements.txt
```

Start:

```bash
uvicorn app:app --host 0.0.0.0 --port $PORT
```

After deployment, configure:

```env
VITE_API_URL=https://YOUR-BACKEND-URL
```

---

# 🌟 Social Impact

Aapda Anveshak is designed to support communities and disaster-response teams by:

### 🛡️ Improving Early Warning

Identify potentially vulnerable locations before conditions become critical.

### 🚑 Supporting Faster Response

Bring alerts, emergency resources, risk intelligence and field reports into one interface.

### 🏘️ Protecting Vulnerable Communities

Help authorities prioritize high-risk locations and potentially affected communities.

### 🌧️ Turning Data Into Action

Convert environmental and geospatial information into understandable risk levels.

### 🌐 Strengthening Disaster Intelligence

Create a unified operational view instead of relying on fragmented information sources.

---

# 🔮 Future Roadmap

* [ ] 📡 Real-time IoT sensor integration
* [ ] 🌧️ Live rainfall & soil-moisture sensors
* [ ] 🛰️ Advanced satellite / remote-sensing analysis
* [ ] 📱 Automated SMS & push notifications
* [ ] 🌍 Advanced PostGIS geospatial analytics
* [ ] 🔐 Production-grade authentication & authorization
* [ ] 🏛️ Real-time government / agency integrations
* [ ] 🤖 Larger historical datasets for ML training
* [ ] 📶 Offline / PWA support for field teams
* [ ] 🌐 Multilingual emergency interface

---

# ⚠️ Safety & Data Disclaimer

Aapda Anveshak is a **disaster-monitoring and decision-support system**.

AI/ML predictions should **not** replace:

* Official disaster warnings
* Field verification
* Government authorities
* Professional emergency-response decisions

Risk scores and model confidence should be evaluated alongside **verified field information, official disaster-management sources, weather observations, and government notices**.

---

# 🏆 Hackathon

### Smart India Hackathon Ecosystem

**Problem:** AI-Based Early Warning & Landslide Risk Monitoring System

**Project:** Aapda Anveshak

**Focus Region:** North Eastern Region (NER), India

The platform combines:

```text
AI/ML
  +
Geospatial Intelligence
  +
Environmental Monitoring
  +
Early Warning
  +
Field Reporting
  +
Emergency Response
```

into a unified disaster-intelligence platform.

---

# 👥 Team

Built for the **Smart India Hackathon ecosystem** as an AI-powered disaster-risk monitoring and early-warning solution.

---

# 📄 License

This project is intended for **educational, research, and hackathon development purposes**, unless otherwise specified by the project owners.

---

<div align="center">

### 🌋 Aapda Anveshak

**Predict. Monitor. Warn. Respond.**

*AI-powered disaster intelligence for a safer North Eastern India.*

⭐ Star the repository if you find the project interesting!

</div>


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
