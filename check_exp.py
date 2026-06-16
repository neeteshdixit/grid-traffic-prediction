from pymongo import MongoClient
db = MongoClient('mongodb://localhost:27017').traffic_prediction
experiments = list(db.experiments.find().sort("created_at", -1).limit(5))
print(f"Total experiments found: {len(experiments)}")
for exp in experiments:
    print(f"Exp ID: {exp['_id']}, Status: {exp['status']}, Name: {exp.get('name')}")
