from pymongo import MongoClient
import json

db = MongoClient('mongodb://localhost:27017').traffic_db
for doc in db.datasets.find():
    print(f"ID: {doc['_id']}, Name: {doc['name']}, Type: {doc['type']}, Rows: {doc['row_count']}, HasDemand: {'demand' in doc.get('schema_info', {}).get('columns', [])}")
