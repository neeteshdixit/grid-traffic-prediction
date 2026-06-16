from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "viewer"

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserOut(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- Dataset Schemas ---
class DatasetOut(BaseModel):
    id: str
    name: str
    filename: str
    filepath: str
    type: str
    row_count: int
    schema_info: Optional[Dict[str, Any]] = None
    uploaded_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Experiment Schemas ---
class ExperimentCreate(BaseModel):
    name: str
    dataset_id: str
    hyperparameters: Optional[Dict[str, Any]] = None

class ExperimentOut(BaseModel):
    id: str
    name: str
    status: str
    dataset_id: str
    hyperparameters: Optional[Dict[str, Any]] = None
    created_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Model Schemas ---
class ModelOut(BaseModel):
    id: str
    experiment_id: str
    name: str
    algorithm: str
    filepath: Optional[str] = None
    r2_score: float
    mae: float
    rmse: float
    metrics_metadata: Optional[Dict[str, Any]] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Prediction Schemas ---
class PredictionCreate(BaseModel):
    model_id: str
    dataset_id: str

class PredictionOut(BaseModel):
    id: str
    model_id: str
    dataset_id: str
    filepath: str
    row_count: int
    generated_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Report Schemas ---
class ReportOut(BaseModel):
    id: str
    name: str
    model_id: str
    filepath: str
    generated_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Audit Log Schemas ---
class AuditLogOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Interactive Prediction Schema ---
class InteractivePredictionCreate(BaseModel):
    geohash: str
    timestamp: str
    weather: str
    temperature: float
    road_type: str
    num_lanes: int
    large_vehicles: str
    landmarks: str

# --- Round 2 Parking Schemas ---
class SimulateEnforcementRequest(BaseModel):
    cluster_id: int
    additional_officers: int

class CopilotChatRequest(BaseModel):
    message: str


