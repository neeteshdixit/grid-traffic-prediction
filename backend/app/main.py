import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.db.session import db
from backend.app.api.endpoints import router as api_router

# Ensure connection to MongoDB on startup
try:
    db.command("ping")
    print("Successfully connected to MongoDB database.")
except Exception as e:
    print(f"Warning: Failed to connect to MongoDB: {str(e)}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade ML engine to forecast urban traffic demand.",
    version="1.0.0"
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev/testing ease
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "message": f"Welcome to the {settings.PROJECT_NAME} API.",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
