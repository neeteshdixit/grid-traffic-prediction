# Enterprise AI Traffic Demand Prediction System

This repository hosts a production-grade spatial-temporal traffic demand forecasting application built for machine learning deployment. The system decodes coordinates, performs automated cleaning and imputation, trains multiple gradient boosting models using group-k-fold cross validation, selects the champion model based on $R^2$ score, and generates explainability analytics using SHAP.

---

## 📖 Table of Contents
1. [Overview & Objectives](#overview--objectives)
2. [Dataset Summary](#dataset-summary)
3. [Documentation Index](#documentation-index)
4. [Enterprise Folder Structure](#enterprise-folder-structure)
5. [Quick Start (Local Deployment)](#quick-start-local-deployment)
6. [Machine Learning Pipeline](#machine-learning-pipeline)
7. [API Endpoints Overview](#api-endpoints-overview)

---

## 🚀 Overview & Objectives
Reactive traffic management fails to address metropolitan congestion. This platform provides **proactive spatial-temporal intelligence**:
* **Predictive Horizon**: Forecast traffic demand 11.5 hours ahead (47 intervals of 15 minutes).
* **Granular Spatial Tracking**: Map demand onto localized 6-character geohash grids.
* **Explainable AI (XAI)**: Demystify predictions with SHAP attribution values to prove why traffic demand will spike.

---

## 📊 Dataset Summary
The models ingest spatial and temporal logs with static and dynamic characteristics:
* **Train Dimensions**: 77,299 rows × 11 columns
* **Test Dimensions**: 41,778 rows × 10 columns (excluding target `demand`)
* **Features**:
  * `geohash`: Spatial identifier (decoded to Latitude/Longitude).
  * `day`: Day index (Train: 48, 49; Test: 49).
  * `timestamp`: 15-minute intervals ("0:0" to "23:45").
  * `RoadType`: Highway, Street, Residential (highly correlated with demand).
  * `NumberofLanes`: 1 to 5 lanes.
  * `LargeVehicles`: Allowed/Not Allowed.
  * `Landmarks`: Yes/No indicator.
  * `Temperature` & `Weather` (Sunny, Rainy, Foggy, Snowy).

---

## 📁 Documentation Index
The project specification documents are available in the repository root:
* 📄 **[BRD.md](BRD.md)**: Business Requirements Document detailing problem statement, metrics, and risk profiles.
* 📄 **[PRD.md](PRD.md)**: Product Requirements Document featuring user stories, functional modules, and timelines.
* 📄 **[FRD.md](FRD.md)**: Functional Requirements Document detailing workflows, validation rules, and Mermaid sequence charts.
* 📄 **[ARCHITECTURE.md](ARCHITECTURE.md)**: System Architecture showing high-level layers, component boundaries, and Nginx deployment.
* 📄 **[DATABASE.md](DATABASE.md)**: Relational schema design and complete SQL DDL generation script for PostgreSQL.
* 📄 **[API_SPEC.md](API_SPEC.md)**: OpenAPI endpoints with JSON request/response payloads.
* 📄 **[ML_DESIGN.md](ML_DESIGN.md)**: Detailed machine learning feature engineering, training configurations, and SHAP setup.
* 📄 **[UI_UX.md](UI_UX.md)**: Dashboard designs, styling patterns, and user interactive mockups.
* 📄 **[DEPLOYMENT.md](DEPLOYMENT.md)**: Dockerfiles, Docker Compose config, and CI/CD pipelines.

---

## 🗂️ Enterprise Folder Structure

```
traffic-prediction/
├── backend/
│   ├── app/
│   │   ├── api/             # API Router endpoints (auth, datasets, models, predictions, explain)
│   │   ├── core/            # Config variables, security models
│   │   ├── db/              # SQL Alchemy setup, database sessions
│   │   ├── models/          # SQLAlchemy Table Declarations
│   │   ├── schemas/         # Pydantic schemas for Request/Response validation
│   │   ├── ml/              # Machine Learning modules (preprocessing, trainer, explainer)
│   │   └── main.py          # FastAPI Entry point
│   ├── tests/               # Backend PyTest scripts
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (Map, Charts, Skeletons, Sidebars)
│   │   ├── pages/           # Next.js pages (Dashboard, Upload, Leaderboard, Reports)
│   │   └── styles/          # Tailwind / CSS stylesheets
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── docs/                    # Architectural specs and manuals
├── docker-compose.yml       # Production orchestrator
└── README.md                # General readme
```

---

## 🛠️ Quick Start (Local Deployment)

1. Clone and navigate to the project directory:
   ```bash
   git clone https://github.com/your-org/traffic-prediction.git
   cd traffic-prediction
   ```
2. Build and start services using Docker Compose:
   ```bash
   docker compose up -d --build
   ```
3. Access the web services:
   * **Next.js Dashboard Client**: `http://localhost:3000`
   * **FastAPI Backend Swagger Docs**: `http://localhost:8000/docs`
   * **PostgreSQL Server**: `localhost:5432`
