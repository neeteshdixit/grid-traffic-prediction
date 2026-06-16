import pandas as pd
from pymongo import MongoClient

db = MongoClient('mongodb://localhost:27017').traffic_prediction
train_ds = db.datasets.find_one({'type': 'train'})
test_ds = db.datasets.find_one({'type': 'test'})

if train_ds and test_ds:
    train_df = pd.read_csv(train_ds['filepath'])
    test_df = pd.read_csv(test_ds['filepath'])
    
    train_geo = set(train_df['geohash'].dropna().unique())
    test_geo = set(test_df['geohash'].dropna().unique())
    
    print(f"Train geohashes: {len(train_geo)}")
    print(f"Test geohashes: {len(test_geo)}")
    print(f"Intersection: {len(train_geo.intersection(test_geo))}")
    print(f"Test geohashes not in train: {len(test_geo - train_geo)}")
else:
    print("Train or test dataset missing in DB")
