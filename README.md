# ΩRBIT — Smart City Operating System

> **Every city has a pulse. We track it.**

ΩRBIT is an enterprise-grade Smart City Operating System designed to centralize municipal operations, automate civic grievance processing via generative artificial intelligence, and provide real-time spatial and 3D telemetry visualization. Built for high-concurrency civic environments, ΩRBIT integrates procedural WebGL urban modeling, automated Natural Language Processing (NLP) routing, real-time weather analytics, and multi-persona command centers.

---

## Technical Architecture

The platform follows a modular microservices architecture separating client presentation, real-time WebGL rendering, intelligent orchestration, and database persistence.

```text
                                  +---------------------------------------+
                                  |         Client Presentation           |
                                  |     (Next.js App Router / React)       |
                                  +-------------------+-------------------+
                                                      |
                         +----------------------------+----------------------------+
                         |                                                         |
                         v                                                         v
         +---------------+---------------+                         +---------------+---------------+
         |     WebGL 3D Engine & Maps    |                         |     State & Realtime Sync     |
         |  (Three.js & Leaflet GIS)     |                         |  (Supabase Realtime / Engine) |
         +-------------------------------+                         +---------------+---------------+
                                                                                   |
                                                                                   v
                                                                   +---------------+---------------+
                                                                   |      FastAPI Microservice     |
                                                                   |  (Python / Async Telemetry)   |
                                                                   +---------------+---------------+
                                                                                   |
                                          +----------------------------------------+----------------------------------------+
                                          |                                                                                 |
                                          v                                                                                 v
                          +---------------+---------------+                                                 +---------------+---------------+
                          |    Google Gemini AI Engine    |                                                 |     Supabase / PostgreSQL     |
                          | (gemini-1.5-flash Classifier) |                                                 |  (Relational Civic Ledger)    |
                          +-------------------------------+                                                 +-------------------------------+
```

### Technical Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14, TypeScript | Server-side rendering, routing, and static generation. |
| **Styling Paradigm** | CSS Modules | Encapsulated component styling maintaining global CSS tokens. |
| **3D Graphics Engine** | Three.js | Procedural WebGL city grid rendering and lighting telemetry. |
| **Animation Engine** | GSAP 3 | Interface state transitions and stagger animations. |
| **Geospatial GIS** | Leaflet.js + OpenStreetMap | Interactive municipal map, cluster markers, and weather layers. |
| **Backend Microservice** | FastAPI, Python 3.11 | Asynchronous high-concurrency API framework. |
| **Database & Auth** | Supabase (PostgreSQL) | Relational persistence, session management, and Realtime sync. |
| **Artificial Intelligence** | Google Gemini API (gemini-1.5-flash) | Automated NLP triage, priority scoring (0-100), and departmental routing. |
| **Voice Processing** | Web Speech API | Client-side speech-to-text processing for English and Hindi dictation. |
| **Telemetry & Weather** | OpenWeatherMap API | Live atmospheric data and particulate matter (AQI) integration. |

---

## Key Platform Features

1. **3D Interactive City Overview**: Procedural urban visualization rendered in vanilla Three.js that dynamically inflates building elevations and displays status beacons based on live complaint data.
2. **Web Speech Voice Submission**: Voice dictation typing in English and Hindi (`en-IN` / `hi-IN`) feeding directly into the Gemini-powered issue classifier.
3. **Composite City Health Score (Ω-Score)**: Formula-driven evaluation of city-wide metrics recalculated periodically, balancing open complaint severity against departmental resolution velocities.
4. **Interactive Spatial Mapping**: Leaflet-based complaint marker groupings, density heatmaps, and OpenWeather atmospheric quality overlays.
5. **Multi-Persona Operational Workspaces**: Customized role-based interfaces supporting Citizen Hub tracking, Officer Desk lifecycle updates (`assigned` -> `in_progress` -> `resolved`), and executive Admin Command Panel controls.
6. **Gemini AI Brain Engine**: Automated Hinglish assistant for real-time municipal status guidance and intelligent departmental routing.

---

## Procedural Architectural Profiles

ΩRBIT generates specialized procedural architectural structures matching the distinct visual identities of major Indian metropolises:

- **Lucknow HQ**: Heritage Awadhi architectural structures featuring octagonal minaret towers, stepped sandstone blocks, terracotta color palettes, and top-mounted onion domes.
- **Mumbai Coast**: Dense maritime skyscrapers featuring twin high-rise towers joined by mid-section skybridges, slanted-roof cylindrical glass towers, and a surrounding coastal water plane.
- **Delhi Capital**: Lutyens-inspired low-rise government blocks, circular colonnade assembly structures, white marble support porticos, and red sandstone domes interspersed with green park spaces.
- **Bengaluru Tech**: Modern corporate tech complexes featuring 45-degree rotated modules, metallic diagrid exterior structural bracing, dark glass facades, and eco-tech roof gardens.

---

## Project Structure

```text
orbit/
├── backend/                        # FastAPI Async Microservice (Python 3.11)
│   ├── models/                     # Pydantic Schemas & Data Validation (`schemas.py`)
│   ├── services/                   # Business Logic & External Integrations
│   │   ├── gemini_service.py       # Google Gemini AI Triage & Hinglish Chat
│   │   ├── health_score.py         # Formula-driven Ω-Score Calculation Engine
│   │   └── weather_cache.py        # OpenWeather & AQI Atmospheric Caching
│   ├── main.py                     # Primary Uvicorn Server Routes & Middleware
│   ├── Dockerfile                  # Container Deployment Definition
│   └── requirements.txt            # Python Dependencies Specification
│
├── frontend/                       # Next.js Web Application (TypeScript)
│   ├── app/                        # App Router Navigation & Pages
│   │   ├── admin/                  # Executive Municipal Control Desk
│   │   ├── brain/                  # Gemini AI Chat Assistant
│   │   ├── dashboard/              # Multi-Persona Workspace State Engine
│   │   ├── map/                    # Leaflet Spatial GIS & Overlay View
│   │   ├── submit/                 # Voice Dictation & Signal Reporting Form
│   │   ├── layout.tsx              # Root Layout, Telemetry Header, & Clock Sync
│   │   └── page.tsx                # 3D City Hero Grid & Real-time KPI Cards
│   ├── components/                 # Client Components & Graphics Systems
│   │   ├── forms/                  # Voice Input & Incident Signal Processing
│   │   ├── map/                    # Leaflet Cluster Markers & Density Heatmaps
│   │   ├── three/                  # Three.js WebGL Engine (`CityScene.tsx`)
│   │   └── ui/                     # Design Tokens (`KPICard`, `OmegaGauge`, `ThemeToggle`)
│   ├── styles/                     # Modular CSS Property Tokens & Themes
│   ├── Dockerfile                  # Frontend Build Container Definition
│   └── package.json                # Node.js Package Manifest
│
├── supabase/                       # Database Governance & Persistence
│   └── schema.sql                  # PostgreSQL Tables, Trigger Policies, & Migrations
│
├── docker-compose.yml              # Multi-Container Orchestration Blueprint
├── .env.example                    # Template Environment Variables Specification
└── README.md                       # Platform System Documentation
```

---

## Running Locally

### Prerequisites
- Node.js (v18.0.0 or higher)
- Python (v3.11 or higher)

### Option A: Manual Setup

#### 1. Backend Service Configuration
Navigate to the backend directory, establish a Python 3.11 virtual environment, and install dependencies:

```bash
cd backend
python -m venv .venv
```

Activate virtual environment:
- Linux/macOS: `source .venv/bin/activate`
- Windows: `.venv\Scripts\activate`

Install dependencies and run FastAPI server:
```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Application Configuration
In a separate terminal session, navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

### Option B: Docker Compose Deployment

To execute containerized deployment for the multi-container architecture:

```bash
docker-compose up --build
```

---

## Environment Variables Configuration

Configure environment variables in root `.env` and `backend/.env` files:

```ini
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

---

## API Reference Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/analytics/summary?city={city}` | Retrieves composite Ω-Score, active ticket counts, AQI telemetry, and ward statistics. |
| **GET** | `/api/complaints?city={city}` | Retrieves active municipal grievances sorted by priority score. |
| **POST** | `/api/complaints` | Submits new multipart civic grievance and triggers Gemini AI classification. |
| **PATCH** | `/api/complaints/{id}` | Updates complaint lifecycle state (`assigned`, `in_progress`, `resolved`) or assigned department. |
| **POST** | `/api/brain/chat` | Interfaces with Gemini AI automated civic query and routing assistant. |
| **GET** | `/api/weather?city={city}` | Fetches live weather conditions and atmospheric pollution metrics. |

---

## Design System & Ergonomics

- **Typography**: Space Grotesk (Display Headers), Inter (Interface Body), JetBrains Mono (Telemetry Data & Ticket IDs).
- **Color Palette**: Pure white/near-black theme variables (`data-theme`), clean solid structural borders, distinct status alerts.
- **Ambient Elements**: Subtle breathing pulse rings (`PulseRing`) surrounding critical composite Ω-Score gauges.

---

## License & Operational Compliance

Copyright (c) 2026 ΩRBIT Smart City Systems. All rights reserved. Built for production deployment and classified civic management environments.
