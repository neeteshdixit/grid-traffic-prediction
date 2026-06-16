import sys
sys.path.insert(0, 'd:/Traffic_pridiction')
from backend.app.ml.pipeline import TrafficMLPipeline
from pymongo import MongoClient
import os

db = MongoClient('mongodb://localhost:27017').traffic_prediction
dataset = db.datasets.find_one({'type': 'train'})
if dataset:
    print("Training on:", dataset['filepath'])
    pipeline = TrafficMLPipeline()
    model_dir = 'backend/data/models'
    os.makedirs(model_dir, exist_ok=True)
    
    report = pipeline.train_and_evaluate(dataset['filepath'], model_dir, {})
    print("Best Model:", report['best_model'])
    for m, met in report['metrics'].items():
         print(f"Model: {m}, R2: {met['r2']:.4f}, MAE: {met['mae']:.4f}")
else:
    print("No train dataset found")
