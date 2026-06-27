# ΩRBIT — Smart City Operating System

> **Every city has a pulse. We track it.**

ΩRBIT is a production-grade Smart City Operating System designed to centralize and visualize urban operations, AI-based complaint routing, real-time analytics, and spatial overlays.

---

## 🌟 Key Features

1. **3D Interactive City Overview**: Procedural city visualization rendered in vanilla Three.js that pulses and glows in real time based on active complaints.
2. **Web Speech Voice Submission**: Voice dictation typing in English and Hindi (en-IN/hi-IN) that feeds live into the Gemini-powered issue classifier.
3. **Composite City Health Score (Ω SCORE)**: Formula-driven evaluation of city-wide metrics recalculated every 5 minutes.
4. **Interactive Spatial Mapping**: Leaflet-based complaint marker groupings, density heatmaps, and OpenWeather air quality overlays.
5. **Government Dashboard**: High-fidelity filtering, status management, and real-time department assignments.
6. **Gemini AI Brain**: Dynamic question-answering assistant configured with regional Hinglish vocabulary.

---

## 🛠️ Project Structure

```text
orbit/
├── frontend/                   # Next.js 14 Web App
│   ├── app/                    # App Router Screens
│   ├── components/             # Three.js & Leaflet Components
│   └── styles/                 # Theme Custom Properties
│
├── backend/                    # FastAPI Microservices
│   ├── models/                 # Pydantic schemas
│   └── services/               # Gemini & Weather logic
│
└── supabase/
    └── schema.sql              # PostgreSQL Database schema
```

---

## ⚙️ Running Locally

### Prerequisites
- Node.js (v18+)
- Python (3.11+)

### Option A: Manual Setup

1. **Backend**:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

### Option B: Docker Compose
```bash
docker-compose up --build
```

---

## 💎 Design System

- **Typography**: Space Grotesk (Headers), Inter (Body), JetBrains Mono (Data/IDs)
- **Palette**: Pure white/near-black themes, clean solid borders, distinct status alerts.
- **Ambient Element**: Subtle breathing breathing ring (`PulseRing`) surrounding critical KPI values.
