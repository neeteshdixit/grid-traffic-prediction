from pymongo import MongoClient

db = MongoClient('mongodb://localhost:27017').traffic_db
result = db.datasets.update_many(
    {'type': 'train', 'schema_info.columns': {'$ne': 'demand'}},
    {'$set': {'type': 'test'}}
)
print(f'Updated {result.modified_count} datasets.')
