# UI/UX Design Specification Document (UI_UX.md)
## Project: Enterprise AI Traffic Demand Prediction System

### Document Control
* **Version**: 1.0.0
* **Date**: June 2, 2026
* **Status**: Approved

---

## 1. Design System & Aesthetics

The system is styled with a premium, modern dashboard theme incorporating glassmorphism, responsive grid systems, and subtle transitions:

* **Primary Palette**: Deep Space Black background (`#0b0f19`), Sleek Slate Card background (`rgba(17, 25, 40, 0.75)` with backdrop filter blur of `12px`), Electric Cyan primary accent (`#06b6d4`), and Alert Amber for warning states.
* **Typography**: Primary typeface is **Outfit** or **Inter** (sans-serif) imported from Google Fonts, utilizing tracking/letter-spacing modifiers for high readability.
* **Animations**: All hover interactions use smooth easing (`cubic-bezier(0.4, 0, 0.2, 1)`) and micro-scaling (e.g. `scale(1.02)`) on cards.

---

## 2. Global Layout Structure

The layout features a persistent Sidebar Navigation combined with a top-bar Breadcrumb/User control panel and a fluid content workspace.

```
+-----------------------------------------------------------------+
| Sidebar    | Top Header: Breadcrumbs | System Status | User Icon|
|            +----------------------------------------------------+
| * Dash     |                                                    |
| * Data     |               Main Content Workspace               |
| * Train    |                                                    |
| * Predict  |               - Responsive Grid Cards              |
| * Analyze  |               - Charts & Tables                    |
| * Reports  |               - Maps                               |
| * Settings |                                                    |
+------------+----------------------------------------------------+
```

---

## 3. Wireframes (Mermaid Format)

### 3.1 Main Analytics Dashboard Wireframe

```mermaid
graph TB
    subgraph UI_Dashboard["Dashboard UI Shell"]
        subgraph TopBar["Top Navigation Bar"]
            Breadcrumb["System / Dashboard"]
            SyncStatus["System Status: Online (API connected)"]
            UserMenu["Sarah Connor (Data Scientist)"]
        end

        subgraph StatsRow["Key Metrics Metrics"]
            Stat1["Total Geohashes: 1,249"]
            Stat2["Active Model: LightGBM v1.2"]
            Stat3["OOF R² Score: 0.8942"]
            Stat4["Mean Demand: 0.0939"]
        end

        subgraph MainContent["Main Analytics Grid"]
            subgraph MapPanel["Geohash Demand Heatmap"]
                MapControls["Time Slider [2:15 PM] | Search Geohash"]
                LeafletMap["[Leaflet Interactive Map Overlay]"]
            end
            subgraph ChartPanel["Temporal Traffic Predictions"]
                DemandChart["[Line Chart: Forecast vs Historical Demand]"]
            end
        end

        subgraph ExplainerPanel["Explainability Console (SHAP)"]
            ShapBeeswarm["[Beeswarm Summary Chart: Feature Importances]"]
        end
    end
```

### 3.2 Dataset Analysis Page Wireframe

```mermaid
graph TB
    subgraph DatasetPage["Dataset Management & Analysis"]
        subgraph UploadZone["Drag & Drop Ingestion Zone"]
            DropTarget["Drop 'train.csv' or 'test.csv' here | Click to Upload"]
            UploadBtn["Upload File (Max 100MB)"]
        end

        subgraph DatasetTable["Uploaded Datasets List"]
            DTable["[Data Table: Name | Row Count | Type | Created At | Actions]"]
        end

        subgraph ProfilerWidget["Dataset Summary Profile"]
            NullCounts["[Bar Chart: Missing values per feature]"]
            CorrMatrix["[Heatmap: Feature Correlation Matrix]"]
        end
    end
```

### 3.3 Model Training & Leaderboard Wireframe

```mermaid
graph TB
    subgraph TrainingPage["Model Training & AutoML Control"]
        subgraph Controls["Pipeline Configuration"]
            SelectData["Select Dataset: [Q2 Traffic Logs]"]
            AlgorithmCheckboxes["[x] XGBoost  [x] LightGBM  [x] CatBoost  [x] Random Forest"]
            FoldsInput["Folds: [ 5 ]"]
            StartBtn["Run AutoML Pipeline (Async)"]
        end

        subgraph TrainingConsole["Real-Time Execution Logs"]
            LogOutput["[Terminal Output: Ingestion... Imputing... Training Fold 1/5...]"]
        end

        subgraph LeaderboardTable["Model Leaderboard"]
            LTable["[Table: Algorithm | CV R² Score | MAE | RMSE | Status | Set Champion]"]
        end
    end
```

### 3.4 Prediction Center Wireframe

```mermaid
graph TB
    subgraph PredictionCenter["Prediction Center"]
        subgraph InputSelection["Batch Scoring Config"]
            SelectModel["Select Active Champion Model: [LightGBM Champion v1.2]"]
            SelectTest["Select Unscored Test Set: [test.csv (41,778 rows)]"]
            RunScoreBtn["Generate Traffic Forecasts"]
        end

        subgraph OutputPanel["Scored Runs & Export"]
            OutputsTable["[Table: Run ID | Scored Rows | Target Model | Generated At | Actions]"]
            DownloadCSV["Download submission.csv button"]
        end
    end
```

---

## 4. Responsive & Interactive Behavior

* **Mobile Breakpoints**: Standard Tailwind screen modifiers are applied (`sm`, `md`, `lg`, `xl`). On screens smaller than `1024px`, the Sidebar collapses into a Hamburguer floating drawer menu, and the two-column grid stacks vertically.
* **Loading States**: Dynamic skeleton loader cards (using a glowing animation pulse) are rendered while fetch requests are in progress.
* **Interactive Tooltips**: Hovering over Map geohashes reveals coordinates, street type, and exact forecasted demand. Clicking a geohash dynamically loads the SHAP local waterfall plot.
