from pymongo import MongoClient
db = MongoClient('mongodb://localhost:27017').traffic_prediction
models = list(db.models.find().sort("created_at", -1).limit(10))
for m in models:
    print(f"Name: {m['name']}, Algo: {m['algorithm']}, R2: {m['r2_score']:.4f}, Active: {m['is_active']}")
