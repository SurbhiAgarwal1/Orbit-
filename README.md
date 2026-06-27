# ΩRBIT — Smart City Operating System

## Executive Summary

ΩRBIT is an enterprise-grade Smart City Operating System designed to centralize municipal operations, automate civic grievance processing via generative artificial intelligence, and provide real-time spatial and 3D telemetry visualization. Built for scalability and high-concurrency civic environments, ΩRBIT integrates procedural WebGL urban modeling, automated Natural Language Processing (NLP) routing, real-time weather analytics, and multi-persona command centers.

---

## Technical Architecture

The system follows a modular microservices architecture separating client presentation, real-time WebGL rendering, intelligent orchestration, and database persistence.

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
         |     WebGL 3D Engine & Maps    |                         |     State & API Middleware    |
         |  (Three.js & Leaflet GIS)     |                         |  (REST API Client Sync Engine)|
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
                          |  (Hinglish NLP Classifier)    |                                                 |  (Relational Civic Ledger)    |
                          +-------------------------------+                                                 +-------------------------------+
```

### Core Technology Stack

- **Frontend Framework**: Next.js 16 (App Router, Server Components, TypeScript)
- **3D Graphics Engine**: Three.js (Procedural geometries, custom lighting models, PCF shadow mapping)
- **GIS Mapping Engine**: Leaflet (Clustered spatial markers, OpenWeather layers)
- **Backend Framework**: FastAPI (Async Python microservice architecture)
- **AI / NLP Services**: Google Gemini API (Structured JSON output parsing, multilingual Hinglish processing)
- **Database Layer**: PostgreSQL via Supabase (Relational civic ledger and spatial querying)
- **Styling Paradigm**: Modular Vanilla CSS custom properties with Space Grotesk, Inter, and JetBrains Mono typography

---

## Key Platform Features

### 1. Procedural 3D City Grid Matrix
Renders procedural 3D urban landscapes deterministically seeded by city selection. Includes real-time celestial lighting (sun and moon trajectories), animated weather systems (drifting cloud clusters in light mode, twinkling stars in dark mode), blueprint wireframe outlines, and multi-colored interior building lighting.

### 2. Multi-Persona Operational Workspaces
Provides three discrete operational interfaces within a unified workspace state machine:
- **Citizen Hub**: Allows residents to track submitted tickets, inspect routed departments, and view assigned operational officers.
- **Officer Workspace**: Departmental desk control enabling department heads to transition ticket states (`assigned` -> `in_progress` -> `resolved`).
- **Admin Command Panel**: Executive telemetry dashboard providing system-wide issue metrics, priority sorting, unassigned ticket routing, and resolution age tracking.

### 3. Voice Dictation & Multilingual AI Classification
Integrated Web Speech API supporting real-time voice input in English and Hindi. Captured transcripts are processed by Gemini AI to automatically infer priority scores (0-100), categorize incident types (road, water, electricity, sanitation, administration), and assign municipal departments.

### 4. Live City Health Scoring Engine (Ω-Score)
A formula-driven algorithmic scoring engine calculating composite municipal health metrics in real-time, factoring open ticket priority metrics, environmental particulate indices (AQI), and historical resolution velocities.

---

## Procedural Architectural Profiles

ΩRBIT generates specialized architectural profiles matching the real-world identity of major Indian metropolises:

- **Lucknow HQ**: Heritage Awadhi architectural structures featuring octagonal minaret towers, stepped sandstone blocks, terracotta color palettes, and top-mounted onion domes.
- **Mumbai Coast**: Dense, tall maritime skyscrapers featuring twin towers connected by mid-section skybridges, slanted-roof cylindrical glass structures, wide podium lobby bases, and an interactive coastal ocean water plane.
- **Delhi Capital**: Wide, low-rise Lutyens-inspired government blocks, circular colonnade assembly buildings, white marble porticos, support columns, and red sandstone domes interspersed with green park spaces.
- **Bengaluru Tech**: Modern corporate tech complexes featuring 45-degree rotated modules, metallic diagrid exterior structural bracing, dark glass facades, high-density glowing windows, and eco-tech roof gardens.

---

## Directory Structure

```text
orbit/
├── backend/                        # FastAPI Python Microservice
│   ├── models/                     # Pydantic data schemas and validation
│   ├── services/                   # AI classification, health metrics, and weather services
│   ├── Dockerfile                  # Container definition for backend service
│   ├── main.py                     # Primary API routes and middleware
│   └── requirements.txt            # Python dependencies
│
├── frontend/                       # Next.js 16 Web Application
│   ├── app/                        # Next.js App Router pages (Overview, Workspace, Admin, Brain, Map)
│   ├── components/                 # Three.js 3D engine, Leaflet GIS, and UI components
│   ├── styles/                     # Global CSS tokens and variables
│   ├── Dockerfile                  # Container definition for frontend service
│   └── package.json                # Node.js dependencies
│
├── supabase/
│   └── schema.sql                  # PostgreSQL database migrations and tables
│
└── docker-compose.yml              # Multi-container orchestration specification
```

---

## Installation & Setup Guide

### Prerequisites
- Node.js (v18.0.0 or higher)
- Python (v3.11 or higher)
- Docker & Docker Compose (Optional, for containerized deployments)

### Option A: Local Development Setup

#### 1. Backend Service Configuration
Navigating to the backend directory and establishing virtual environment:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:
- **Linux/macOS**: `source .venv/bin/activate`
- **Windows**: `.venv\Scripts\activate`

Install dependencies and start server:
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

The web application will be accessible at `http://localhost:3000`.

---

### Option B: Docker Container Deployment

To launch the entire platform using Docker Compose:

```bash
docker-compose up --build
```

---

## Environment Variables Configuration

Create a `.env` file in the root directory and inside `backend/` with the following variables:

```ini
# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Backend Service API Base
NEXT_PUBLIC_API_URL=http://localhost:8000

# Database Configuration (Supabase / PostgreSQL)
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

---

## API Reference Overview

### Summary Analytics
- `GET /api/analytics/summary?city={cityName}`
  - Returns calculated Ω-Score, active open complaint count, resolved today metrics, current AQI, and ward arrays.

### Grievance Operations
- `GET /api/complaints?city={cityName}`
  - Retrieves all reported civic complaints for the specified city sorted by priority score.
- `POST /api/complaints`
  - Creates a new civic ticket. Accepts multipart form data including voice transcript text, title, description, and attached images. Executes Gemini AI automated triage.
- `PATCH /api/complaints/{complaintId}`
  - Updates ticket lifecycle status (`assigned`, `in_progress`, `resolved`) or assigns departmental routing.

### AI Intelligence Engine
- `POST /api/brain/chat`
  - Interfaces directly with the Hinglish Gemini AI assistant for real-time municipal status queries and guidance.

---

## Production Build Verification

To execute a full production compilation and verify static generation:

```bash
cd frontend
npm run build
```

---

## License & Operational Compliance

Copyright (c) 2026 ΩRBIT Smart City Systems. All rights reserved. Built for production deployment and classified civic management environments.
