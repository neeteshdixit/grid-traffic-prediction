import os

class Settings:
    PROJECT_NAME: str = "Enterprise AI Traffic Demand Prediction System"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Storage Paths
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    MODEL_DIR: str = os.path.join(BASE_DIR, "models")
    PREDICTION_DIR: str = os.path.join(BASE_DIR, "predictions")
    REPORT_DIR: str = os.path.join(BASE_DIR, "reports")
    
    # MongoDB configuration
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "traffic_prediction")


settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.MODEL_DIR, exist_ok=True)
os.makedirs(settings.PREDICTION_DIR, exist_ok=True)
os.makedirs(settings.REPORT_DIR, exist_ok=True)
