import pandas as pd
import sys
import numpy as np
sys.path.insert(0, 'd:/Traffic_pridiction')

from backend.app.ml.pipeline import TrafficMLPipeline

pipeline = TrafficMLPipeline()
from pymongo import MongoClient
db = MongoClient('mongodb://localhost:27017').traffic_prediction
dataset = db.datasets.find_one() # Get any dataset
if dataset:
    df = pd.read_csv(dataset['filepath'])
    # Force a demand column if it's test data
    if 'demand' not in df.columns:
        df['demand'] = 0.5
    print("CSV loaded:", dataset['filepath'])
    stats = pipeline._build_statistics(df)
    features, enriched = pipeline._prepare_features(df, stats, fit=True)
    print("Features preview:")
    cols = ['geohash_mean', 'geohash_hour_mean', 'geohash_day_mean']
    available_cols = [c for c in cols if c in features.columns]
    print(features[available_cols].head(10))
    print("NaN counts:")
    print(features[available_cols].isna().sum())
