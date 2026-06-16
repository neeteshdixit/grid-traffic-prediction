# API Specification Document (API_SPEC.md)
## Project: Enterprise AI Traffic Demand Prediction System

### Document Control
* **Version**: 1.0.0
* **Date**: June 2, 2026
* **Status**: Approved

---

## 1. Authentication APIs

### 1.1 User Login
* **Method & Path**: `POST /api/v1/auth/login`
* **Description**: Authenticate user credentials and return access and refresh JWT tokens.
* **Request Header**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "email": "scientist@traffic.ai",
  "password": "SecurePassword123!"
}
```
* **Response (200 OK)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": {
    "id": "76dfd284-82a8-48b4-b49d-fb748b945d8b",
    "email": "scientist@traffic.ai",
    "full_name": "Sarah Connor",
    "role": "data_scientist"
  }
}
```
* **Error Response (401 Unauthorized)**:
```json
{
  "detail": "Invalid credentials provided."
}
```

---

## 2. Dataset APIs

### 2.1 Upload Dataset
* **Method & Path**: `POST /api/v1/datasets/upload`
* **Description**: Ingest training or testing CSV datasets.
* **Request Format**: `multipart/form-data`
* **Request Fields**:
  * `file`: (Binary File) `train.csv` or `test.csv`
  * `name`: "Q2 Traffic Logs"
  * `type`: "train" (or "test")
* **Response (201 Created)**:
```json
{
  "id": "c39a2fb6-82eb-4ff3-982d-e2ef64db9f5a",
  "name": "Q2 Traffic Logs",
  "filename": "train.csv",
  "filepath": "uploads/c39a2fb6-82eb-4ff3-982d-e2ef64db9f5a.csv",
  "type": "train",
  "row_count": 77299,
  "uploaded_by": "76dfd284-82a8-48b4-b49d-fb748b945d8b",
  "created_at": "2026-06-02T22:00:00Z"
}
```

### 2.2 List Datasets
* **Method & Path**: `GET /api/v1/datasets`
* **Response (200 OK)**:
```json
[
  {
    "id": "c39a2fb6-82eb-4ff3-982d-e2ef64db9f5a",
    "name": "Q2 Traffic Logs",
    "type": "train",
    "row_count": 77299,
    "created_at": "2026-06-02T22:00:00Z"
  }
]
```

### 2.3 Get Dataset Profiling Report
* **Method & Path**: `GET /api/v1/datasets/{id}/profile`
* **Response (200 OK)**:
```json
{
  "dataset_id": "c39a2fb6-82eb-4ff3-982d-e2ef64db9f5a",
  "dimensions": { "rows": 77299, "columns": 11 },
  "missing_values": {
    "RoadType": 600,
    "Temperature": 2495,
    "Weather": 797
  },
  "columns": {
    "demand": {
      "mean": 0.0939,
      "std": 0.1422,
      "min": 6.24e-07,
      "max": 1.0
    }
  }
}
```

---

## 3. Training APIs

### 3.1 Start AutoML Run
* **Method & Path**: `POST /api/v1/training/start`
* **Request Body**:
```json
{
  "name": "Exp-001-AutoML",
  "dataset_id": "c39a2fb6-82eb-4ff3-982d-e2ef64db9f5a",
  "hyperparameters": {
    "folds": 5,
    "tune_iterations": 10
  }
}
```
* **Response (202 Accepted)**:
```json
{
  "experiment_id": "d04a62bb-49e0-47b2-b13c-1b779e5fb823",
  "status": "pending",
  "message": "Automated ML training pipeline started."
}
```

### 3.2 Get Model Leaderboard
* **Method & Path**: `GET /api/v1/models/leaderboard`
* **Response (200 OK)**:
```json
[
  {
    "id": "e8fd21c0-0582-4fdb-ac1c-99d8213cf9a1",
    "name": "LightGBM Champion",
    "algorithm": "LightGBM",
    "r2_score": 0.8942,
    "mae": 0.0152,
    "rmse": 0.0289,
    "is_active": true
  },
  {
    "id": "a189f381-817f-4f66-880c-2a67e1a3bc42",
    "name": "XGBoost Alternate",
    "algorithm": "XGBoost",
    "r2_score": 0.8874,
    "mae": 0.0161,
    "rmse": 0.0302,
    "is_active": false
  }
]
```

---

## 4. Prediction APIs

### 4.1 Score Test Set
* **Method & Path**: `POST /api/v1/predictions/score`
* **Request Body**:
```json
{
  "model_id": "e8fd21c0-0582-4fdb-ac1c-99d8213cf9a1",
  "dataset_id": "b1823ab6-b8db-4e12-881b-eeef043db9aa"
}
```
* **Response (200 OK)**:
```json
{
  "prediction_id": "fa9f8e43-85bb-41db-ae8e-fb93108c352d",
  "row_count": 41778,
  "filepath": "predictions/fa9f8e43-85bb-41db-ae8e-fb93108c352d.csv",
  "download_url": "/api/v1/predictions/download/fa9f8e43-85bb-41db-ae8e-fb93108c352d"
}
```

### 4.2 Download Prediction CSV
* **Method & Path**: `GET /api/v1/predictions/download/{id}`
* **Response**: Binary stream of CSV contents. Content-Disposition: `attachment; filename="predictions.csv"`.

---

## 5. Analytics & Explainability APIs

### 5.1 Get Global SHAP Importance
* **Method & Path**: `GET /api/v1/explain/shap/global?model_id={id}`
* **Response (200 OK)**:
```json
{
  "model_id": "e8fd21c0-0582-4fdb-ac1c-99d8213cf9a1",
  "shap_values": {
    "NumberofLanes": 0.125,
    "RoadType_Highway": 0.289,
    "hour": 0.187,
    "LargeVehicles_Allowed": 0.065,
    "Temperature": 0.012
  }
}
```

### 5.2 Get Local SHAP Explanation
* **Method & Path**: `GET /api/v1/explain/shap/local`
* **Query Parameters**: `model_id={uuid}&geohash=qp02z1&timestamp=12:00`
* **Response (200 OK)**:
```json
{
  "base_value": 0.0939,
  "prediction": 0.612,
  "features": {
    "RoadType_Highway": { "value": 1.0, "shap": 0.35 },
    "NumberofLanes": { "value": 4.0, "shap": 0.12 },
    "hour": { "value": 12.0, "shap": 0.08 }
  }
}
```

---

## 6. Report & Audit APIs

### 6.1 Generate Model Report
* **Method & Path**: `POST /api/v1/reports/generate`
* **Request Body**:
```json
{
  "model_id": "e8fd21c0-0582-4fdb-ac1c-99d8213cf9a1"
}
```
* **Response (200 OK)**:
```json
{
  "report_id": "22ff04ab-8a47-4952-ba63-dfcb219084cf",
  "filepath": "reports/22ff04ab-8a47-4952-ba63-dfcb219084cf.pdf"
}
```

### 6.2 Get Audit Logs
* **Method & Path**: `GET /api/v1/admin/audit-logs`
* **Response (200 OK)**:
```json
[
  {
    "id": "ee0428d0-23a8-442b-980b-df787be42ab0",
    "user_email": "admin@traffic.ai",
    "action": "MODEL_TRAIN_START",
    "details": "User triggered AutoML run Exp-001",
    "created_at": "2026-06-02T22:04:12Z"
  }
]
```
