import sys
import os
sys.path.insert(0, 'd:/Traffic_pridiction')

from backend.app.db.session import db

for doc in db.datasets.find():
    print(f"ID: {doc['_id']}, Name: {doc['name']}, Type: {doc['type']}, Rows: {doc['row_count']}, HasDemand: {'demand' in doc.get('schema_info', {}).get('columns', [])}")

# Fix it
result = db.datasets.update_many(
    {'type': 'train', 'schema_info.columns': {'$ne': 'demand'}},
    {'$set': {'type': 'test'}}
)
print(f'Updated {result.modified_count} datasets.')
