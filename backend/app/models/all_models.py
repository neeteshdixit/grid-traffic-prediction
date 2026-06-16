import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, DateTime, BigInteger, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.db.session import Base

# Helper to support UUID across SQLite and PostgreSQL
def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="viewer") # admin, data_scientist, analyst, viewer
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    datasets = relationship("Dataset", back_populates="uploader")
    experiments = relationship("Experiment", back_populates="creator")
    predictions = relationship("Prediction", back_populates="generator")
    reports = relationship("Report", back_populates="generator")
    audit_logs = relationship("AuditLog", back_populates="user")

class Dataset(Base):
    __tablename__ = "datasets"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(1024), nullable=False)
    type = Column(String(50), nullable=False) # train or test
    row_count = Column(BigInteger, nullable=False)
    schema_info = Column(JSON, nullable=True) # stores column statistics
    uploaded_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    uploader = relationship("User", back_populates="datasets")
    experiments = relationship("Experiment", back_populates="dataset")
    predictions = relationship("Prediction", back_populates="dataset")

class Experiment(Base):
    __tablename__ = "experiments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="pending") # pending, running, completed, failed
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    hyperparameters = Column(JSON, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    dataset = relationship("Dataset", back_populates="experiments")
    creator = relationship("User", back_populates="experiments")
    models = relationship("Model", back_populates="experiment")

class Model(Base):
    __tablename__ = "models"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    experiment_id = Column(String(36), ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    algorithm = Column(String(100), nullable=False)
    filepath = Column(String(1024), nullable=False)
    r2_score = Column(Float, nullable=False)
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    metrics_metadata = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    experiment = relationship("Experiment", back_populates="models")
    predictions = relationship("Prediction", back_populates="model")
    reports = relationship("Report", back_populates="model")

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_id = Column(String(36), ForeignKey("models.id", ondelete="CASCADE"), nullable=False)
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    filepath = Column(String(1024), nullable=False)
    row_count = Column(BigInteger, nullable=False)
    generated_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    model = relationship("Model", back_populates="predictions")
    dataset = relationship("Dataset", back_populates="predictions")
    generator = relationship("User", back_populates="predictions")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    model_id = Column(String(36), ForeignKey("models.id", ondelete="CASCADE"), nullable=False)
    filepath = Column(String(1024), nullable=False)
    generated_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    model = relationship("Model", back_populates="reports")
    generator = relationship("User", back_populates="reports")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(255), nullable=False)
    details = Column(String(2048), nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="audit_logs")
