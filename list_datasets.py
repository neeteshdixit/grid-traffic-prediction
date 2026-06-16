from pymongo import MongoClient
db = MongoClient('mongodb://localhost:27017').traffic_prediction
for ds in db.datasets.find():
    print(f"ID: {ds['_id']}, Name: {ds['name']}, Type: {ds['type']}, Rows: {ds['row_count']}, Columns: {len(ds.get('schema_info', {}).get('columns', []))}")
