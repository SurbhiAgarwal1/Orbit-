India mein civic complaints ka average resolution time 21 days hai.
ΩRBIT target: 4 days.

## Executive Summary

ΩRBIT is an enterprise-grade Smart City Operating System designed to centralize municipal operations, automate civic grievance processing via generative artificial intelligence, and provide real-time spatial and 3D telemetry visualization. Guided by the core principle, "Every city has a pulse. We track it.", ΩRBIT integrates procedural WebGL urban modeling, automated Natural Language Processing (NLP) routing, real-time weather analytics, and multi-persona command centers. The platform dynamically measures city-wide wellness through the Ω-Score, an automated composite metric reflecting active municipal status and resolution velocities across urban wards.

## System Architecture

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

## Technical Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14, TypeScript | React framework for server-side rendering, routing, and type safety. |
| **Styling Paradigm** | CSS Modules | Encapsulated component styling maintaining global design custom properties. |
| **3D Graphics Engine** | Three.js | Procedural WebGL city grid rendering, dynamic shadows, and lighting. |
| **Animation Engine** | GSAP 3 | High-performance interface state transitions and stagger effects. |
| **Geospatial GIS** | Leaflet.js + OpenStreetMap | Interactive municipal map, cluster markers, and weather overlays. |
| **Backend API** | FastAPI, Python 3.11 | Asynchronous high-concurrency microservice framework. |
| **Database & Auth** | Supabase (PostgreSQL) | Relational persistence, session authentication, and Realtime sync. |
| **Artificial Intelligence** | Google Gemini API (gemini-1.5-flash) | Automated NLP triage, priority scoring (0-100), and departmental routing. |
| **Voice Processing** | Web Speech API | Client-side speech-to-text processing for English and Hindi dictation. |
| **Telemetry & Weather** | OpenWeatherMap API | Live atmospheric data and particulate matter (AQI) integration. |
| **Infrastructure Deployment** | Vercel + Railway + Docker | Multi-region production deployment and container orchestration. |

## Key Features

Procedural 3D city grid that reacts to live complaint data dynamically renders urban blocks in vanilla WebGL. As civic grievances are filed, corresponding building nodes inflate, alter elevation, and display bouncing status beacons with color-coded severity markers that reflect real-time ward pressure.

Voice complaint input in Hindi and English enables accessible civic engagement directly through client browser interfaces. The system utilizes the Web Speech API to capture natural vocal dictation, automatically parsing speech patterns into structured textual reports without requiring manual typing.

Gemini AI auto-classification with priority score 0-100 leverages the gemini-1.5-flash model to evaluate submitted civic reports upon ingestion. The engine assigns an automated severity score, categorizes the incident into municipal domains, and routes the ticket to responsible operational departments.

Real-time sync across citizen and official dashboards powered by Supabase Realtime ensures instantaneous data telemetry. State modifications performed by departmental personnel propagate immediately to citizen tracking screens and executive analytics boards without page refreshes.

Ω-Score: composite city health score, updates every 60 seconds by executing an algorithmic evaluation of city-wide wellness. The mathematical formulation balances active unassigned incident densities, high-priority severity indices, and recent departmental resolution velocities to establish an index from 0 to 100.

Predictive alert banner when complaint surges detected continuously monitors incoming telemetry for anomalous incident volume spikes within localized wards. When threshold limits are breached, executive dashboards display prominent alert banners instructing administrators to deploy emergency municipal units.

City selector: Lucknow, Mumbai, Delhi, Bengaluru incorporates distinct architectural generation rules and spatial parameters for each municipality. Switching active cities recalculates grid spacing, procedural geometry shapes, outline blueprint colors, and localized environmental telemetry.

Dark and light theme, both fully polished provide optimized visual ergonomics for round-the-clock municipal control room operations. Themes seamlessly swap background colors, directional solar/lunar light sources, cloud structures, and neon building window matrices.

Multi-persona workspaces: Citizen Hub, Officer Workspace, Admin Command Panel provide customized role-based interfaces. Citizens monitor personal submission statuses, departmental officers update task lifecycles, and municipal administrators exercise overall system governance.

## City Architectural Profiles

- **Lucknow**: Heritage Awadhi architecture featuring octagonal minaret towers, stepped sandstone blocks, terracotta color palettes, and top-mounted onion domes.
- **Mumbai**: Dense maritime skyscrapers featuring twin high-rise towers joined by mid-section skybridges, slanted-roof cylindrical glass towers, and a surrounding coastal water plane.
- **Delhi**: Lutyens-inspired low-rise government blocks, circular colonnade assembly structures, white marble support porticos, and red sandstone domes interspersed with green park spaces.
- **Bengaluru**: Modern tech complexes featuring 45-degree rotated modules, metallic diagrid exterior structural bracing, dark glass facades, and eco-tech roof gardens.

## Folder Structure

```text
orbit/
├── frontend/        # Next.js 14
├── backend/         # FastAPI
├── supabase/        # schema.sql
└── docker-compose.yml
```

## Installation & Setup

### Option A: Local Development Setup

#### 1. Backend Service Configuration
Navigate to the backend directory, establish a Python 3.11 virtual environment, and install dependencies:

```bash
cd backend
python -m venv .venv
```

Activate virtual environment:
- Linux/macOS: `source .venv/bin/activate`
- Windows: `.venv\Scripts\activate`

Install requirements and start FastAPI service:
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

To execute containerized deployment for the entire microservice architecture:

```bash
docker-compose up --build
```

## Environment Variables

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

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/analytics/summary?city={city}` | Retrieves composite Ω-Score, active ticket counts, AQI telemetry, and ward statistics. |
| **GET** | `/api/complaints?city={city}` | Retrieves active municipal grievances sorted by priority score. |
| **POST** | `/api/complaints` | Submits new multipart civic grievance and triggers Gemini AI classification. |
| **PATCH** | `/api/complaints/{id}` | Updates complaint lifecycle state (`assigned`, `in_progress`, `resolved`) or department. |
| **POST** | `/api/brain/chat` | Interfaces with Gemini AI automated civic query and routing assistant. |
| **GET** | `/api/weather?city={city}` | Fetches live weather conditions and atmospheric pollution metrics. |

## Live Demo

🔗 [orbit.vercel.app](https://orbit.vercel.app)

![ΩRBIT System Overview](./assets/screenshots/overview.png)

## License

Copyright (c) 2026 ΩRBIT Smart City Systems. All rights reserved.
