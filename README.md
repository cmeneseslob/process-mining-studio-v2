# Process Mining Studio v2

A modern, interactive process mining application built with **FastAPI + PM4Py** on the backend and **React + React Flow** on the frontend. Inspired by tools like Celonis and Fluxicon Disco — rebuilt from scratch for a richer, more dynamic experience.

![stack](https://img.shields.io/badge/stack-FastAPI%20%2B%20React-6366f1?style=flat-square)
![license](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)

---

## Features

| View | Description |
|---|---|
| **Process Discovery** | Interactive DFG (Directly-Follows Graph) with pan/zoom, animated edges, and Disco-style activity/path sliders |
| **Variant Analysis** | All process variants ranked by frequency with Pareto chart and one-click isolation |
| **Performance & KPIs** | Cycle time histogram, active-cases workload chart, percentile breakdown, activity frequency |
| **Advanced Filters** | Filter by date range, case duration, start/end activity, and required activities — propagated to all views |

**UI highlights:** dark mode, Framer Motion transitions, collapsible sidebar, drag-and-drop file upload, CSV column mapping.  
**Supported formats:** XES (`.xes`) and CSV (`.csv`) event logs.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) |
| Process Mining | [PM4Py](https://pm4py.fit.fraunhofer.de/) |
| Frontend | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/) |
| Graph Visualization | [@xyflow/react](https://reactflow.dev/) + [Dagre](https://github.com/dagrejs/dagre) layout |
| Styling | [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) primitives |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Charts | [Recharts](https://recharts.org/) |
| State | [Zustand](https://zustand-demo.pmnd.rs/) |

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API available at `http://localhost:8000` · Interactive docs at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App opens at `http://localhost:5173`.

> The Vite dev server proxies all `/api` requests to port 8000 — no CORS config needed in development.

### Quick start (both servers at once)

```bash
chmod +x start.sh && ./start.sh
```

---

## Project Structure

```
.
├── backend/
│   ├── main.py                     # FastAPI app entry point
│   ├── requirements.txt
│   ├── models/
│   │   └── schemas.py              # Pydantic v2 request/response models
│   ├── routers/
│   │   ├── sessions.py             # Upload, demo, session info
│   │   └── analysis.py             # DFG, variants, performance, filters
│   └── services/
│       ├── log_service.py          # In-memory session store + filter logic
│       ├── dfg_service.py          # DFG discovery (frequency & performance)
│       ├── variant_service.py      # Variant analysis
│       └── performance_service.py  # KPIs, histograms, workload
└── frontend/
    └── src/
        ├── api/client.ts           # Axios API client
        ├── store/useStore.ts       # Zustand global state
        ├── types/index.ts          # TypeScript interfaces
        ├── components/
        │   ├── layout/             # AppLayout, Sidebar
        │   └── graph/              # DFGGraph, ActivityNode (React Flow)
        └── views/                  # WelcomeView, DiscoveryView, VariantsView,
                                    # PerformanceView, FiltersView
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/sessions/demo` | Load the built-in P2P demo log |
| `POST` | `/api/sessions/upload` | Upload a CSV or XES event log |
| `GET` | `/api/sessions/{id}` | Get session info (cases, events, filter status) |
| `GET` | `/api/analysis/{id}/dfg` | Get DFG nodes + edges (`mode`, `activities_pct`, `paths_pct`) |
| `GET` | `/api/analysis/{id}/variants` | Get all variants with cumulative % |
| `GET` | `/api/analysis/{id}/performance` | Get KPIs, histogram, workload, percentiles |
| `POST` | `/api/analysis/{id}/filters` | Apply filters (date, duration, activity) |
| `DELETE` | `/api/analysis/{id}/filters` | Reset to full unfiltered log |

---

## Demo Log

Click **Load Demo** in the sidebar to explore a synthetic Purchase-to-Pay (P2P) process with 500 cases and 6 process variants, ranging from the happy path to exception flows.

---

## Event Log Sources

- [PM4Py Sample Datasets](https://pm4py.fit.fraunhofer.de/datasets)
- [4TU Research Data – Event Logs](https://data.4tu.nl/search?q=event+log)
- [BPI Challenge Logs](https://www.tf-pm.org/resources/logs)

---

## License

MIT
