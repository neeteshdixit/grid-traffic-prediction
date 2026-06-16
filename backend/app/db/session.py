from pymongo import MongoClient
from backend.app.core.config import settings

# Create MongoDB client and connect to the specified database
client = MongoClient(settings.MONGODB_URL)
db = client[settings.MONGODB_DB_NAME]

# Automatically build indexes for optimal querying
try:
    db.parking_hotspots.create_index("cluster_id")
    db.parking_hotspots.create_index([("congestion_score", -1)])
    db.parking_hotspots.create_index("geohash")
except Exception as e:
    print(f"Index creation warning: {e}")

def get_db():
    """
    FastAPI dependency yielding the MongoDB database instance.
    Connection pooling is managed natively by PyMongo's MongoClient.
    """
    try:
        yield db
    finally:
        pass
