# ΩRBIT — Smart City Operating System

> **Every city has a pulse. We track it.**

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?style=flat-square&logo=fastapi)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=flat-square&logo=three.js)
![Google Gemini](https://img.shields.io/badge/Gemini_AI-1.5_Flash-orange?style=flat-square&logo=google)
![Docker](https://img.shields.io/badge/Docker-Containerized-blue?style=flat-square&logo=docker)

ΩRBIT is an enterprise-grade Smart City Operating System designed to centralize municipal operations, automate civic grievance processing via generative artificial intelligence, and provide real-time spatial and 3D telemetry visualization. Built for high-concurrency civic environments, ΩRBIT integrates procedural WebGL urban modeling, automated Natural Language Processing (NLP) routing, real-time weather analytics, and multi-persona command centers.

---

## Interactive Navigation

- [Market Problem & ΩRBIT Solution](#market-problem--orbit-solution)
- [Technical Architecture](#technical-architecture)
- [Technical Stack](#technical-stack)
- [Key Platform Features](#key-platform-features)
- [Procedural Architectural Profiles](#procedural-architectural-profiles)
- [Project Structure](#project-structure)
- [Running Locally & Deployment](#running-locally)
- [Environment Variables Configuration](#environment-variables-configuration)
- [Interactive API Reference](#api-reference-overview)
- [License & Compliance](#license--operational-compliance)

---

## Market Problem & ΩRBIT Solution

### The Current Market Problem
- **Massive Inefficiency & Resolution Latency**: Municipal grievance redressal systems in developing smart cities suffer from an average resolution latency of 21 days due to manual paperwork and fragmented departmental communication.
- **Siloed Systems & Data Blind Spots**: City administration controls lack unified real-time telemetry. Water, electricity, sanitation, and public works operate in isolated silos without spatial or predictive visibility.
- **High-Friction Civic Reporting**: Citizens face complex submission portals, manual form filling, and zero visibility into the real-time resolution status of their reported issues.

### The ΩRBIT Solution
- **Target Resolution Velocity (4 Days)**: Automates municipal routing and ticket lifecycle management to compress average grievance lifecycles from 21 days down to 4 days.
- **Unified 3D Spatial Operating System**: Synthesizes real-time civic telemetry, OpenWeather atmospheric data, and ward-level health scoring into an interactive WebGL 3D urban twin and Leaflet GIS mapping overlay.
- **Generative AI Triage & Multilingual Voice Accessibility**: Replaces manual form filing with Web Speech voice dictation (English/Hindi) and leverages Google Gemini AI for automated severity scoring (0-100), domain classification, and direct operational officer routing.

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

---

## Technical Stack

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

<details>
<summary><strong>Click to Expand Municipal 3D Profile Specifications</strong></summary>

<br />

- **Lucknow HQ**: Heritage Awadhi architectural structures featuring octagonal minaret towers, stepped sandstone blocks, terracotta color palettes, and top-mounted onion domes.
- **Mumbai Coast**: Dense maritime skyscrapers featuring twin high-rise towers joined by mid-section skybridges, slanted-roof cylindrical glass towers, and a surrounding coastal water plane.
- **Delhi Capital**: Lutyens-inspired low-rise government blocks, circular colonnade assembly structures, white marble support porticos, and red sandstone domes interspersed with green park spaces.
- **Bengaluru Tech**: Modern corporate tech complexes featuring 45-degree rotated modules, metallic diagrid exterior structural bracing, dark glass facades, and eco-tech roof gardens.

</details>

---

## Project Structure

<details>
<summary><strong>Click to Expand Repository Directory Tree</strong></summary>

<br />

```text
orbit/
├── backend/                        # FastAPI Async Microservice (Python 3.11)
│   ├── models/                     # Data validation schemas
│   ├── services/                   # AI triage, Ω-Score engine, & weather services
│   ├── main.py                     # Server routes & API middleware
│   └── Dockerfile                  # Backend container configuration
│
├── frontend/                       # Next.js Web Application (TypeScript)
│   ├── app/                        # Main application routes (Dashboard, Admin, Brain, Map)
│   ├── components/                 # Three.js 3D WebGL engine, Leaflet GIS, & UI tiles
│   └── styles/                     # Design system CSS properties & theme tokens
│
├── supabase/                       # PostgreSQL database schema & realtime rules
│   └── schema.sql                  
│
└── docker-compose.yml              # Multi-container orchestration specification
```

</details>

---

## Running Locally

### Prerequisites
- Node.js (v18.0.0 or higher)
- Python (v3.11 or higher)

<details>
<summary><strong>Option A: Manual Local Setup Instructions</strong></summary>

<br />

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

</details>

<details>
<summary><strong>Option B: Docker Compose Deployment Instructions</strong></summary>

<br />

To execute containerized deployment for the multi-container architecture:

```bash
docker-compose up --build
```

</details>

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

<details open>
<summary><strong>Interactive API Endpoints Table</strong></summary>

<br />

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/analytics/summary?city={city}` | Retrieves composite Ω-Score, active ticket counts, AQI telemetry, and ward statistics. |
| **GET** | `/api/complaints?city={city}` | Retrieves active municipal grievances sorted by priority score. |
| **POST** | `/api/complaints` | Submits new multipart civic grievance and triggers Gemini AI classification. |
| **PATCH** | `/api/complaints/{id}` | Updates complaint lifecycle state (`assigned`, `in_progress`, `resolved`) or assigned department. |
| **POST** | `/api/brain/chat` | Interfaces with Gemini AI automated civic query and routing assistant. |
| **GET** | `/api/weather?city={city}` | Fetches live weather conditions and atmospheric pollution metrics. |

</details>

---

## License & Operational Compliance

Copyright (c) 2026 ΩRBIT Smart City Systems. All rights reserved. Built for production deployment and classified civic management environments.
