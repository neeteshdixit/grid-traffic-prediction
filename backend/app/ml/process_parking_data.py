import os
import sys
import uuid
from datetime import datetime
from pymongo import MongoClient

# Add app to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from backend.app.ml.parking_pipeline import ParkingMLPipeline
from backend.app.core.config import settings

def main():
    print("=== PARKING VIOLATION INTELLIGENCE WORKFLOW ===")
    dataset_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../e88186124ec611f1/dataset/jan to may police violation_anonymized791b166.csv"))
    
    if not os.path.exists(dataset_path):
        print(f"Error: Dataset not found at {dataset_path}")
        return
        
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    # Register dataset in MongoDB if not already present
    ds_record = db.datasets.find_one({"type": "parking_violation"})
    if not ds_record:
        print("Registering parking dataset in DB...")
        dataset_uuid = str(uuid.uuid4())
        ds_record = {
            "_id": dataset_uuid,
            "name": "January to May Police Violation Dataset",
            "filename": os.path.basename(dataset_path),
            "filepath": dataset_path,
            "type": "parking_violation",
            "row_count": 298450,
            "schema_info": {
                "columns": ["id", "latitude", "longitude", "location", "vehicle_number", "vehicle_type", "violation_type", "police_station", "junction_name", "created_datetime", "validation_status"],
                "dtypes": {
                    "latitude": "float64",
                    "longitude": "float64",
                    "violation_type": "object",
                    "created_datetime": "object"
                }
            },
            "uploaded_by": "system",
            "created_at": datetime.utcnow()
        }
        db.datasets.insert_one(ds_record)
        print(f"Dataset registered with ID: {dataset_uuid}")
    else:
        print(f"Dataset already registered: {ds_record['_id']}")
        
    pipeline = ParkingMLPipeline()
    
    # 1. Run clustering & feature extraction
    print("\nStep 1: Clustering violations and computing congestion scores...")
    hotspots = pipeline.process_and_cluster(dataset_path)
    
    # 2. Run forecasting
    print("\nStep 2: Training forecaster and generating future probabilities...")
    forecasts = pipeline.forecast_hotspots(dataset_path)
    
    # 3. Merge forecasts into hotspots
    print("\nStep 3: Merging forecasts into hotspots...")
    merged_count = 0
    for h in hotspots:
        gh = h["geohash"]
        # Find match by exact geohash or prefix
        f_info = forecasts.get(gh)
        if not f_info:
            # Look for closest geohash match in forecasts
            best_match = None
            best_overlap = 0
            for f_gh in forecasts.keys():
                overlap = 0
                for char1, char2 in zip(gh, f_gh):
                    if char1 == char2:
                        overlap += 1
                    else:
                        break
                if overlap > best_overlap:
                    best_overlap = overlap
                    best_match = f_gh
            if best_match and best_overlap >= 4:
                f_info = forecasts[best_match]
                
        if f_info:
            h["tomorrow_predicted_count"] = f_info["tomorrow_predicted_count"]
            h["tomorrow_probability"] = f_info["tomorrow_probability"]
            h["next_week_predicted_count"] = f_info["next_week_predicted_count"]
            h["next_week_probability"] = f_info["next_week_probability"]
            merged_count += 1
        else:
            # Fallback defaults
            h["tomorrow_predicted_count"] = round(h["total_violations"] / 120.0, 2)
            h["tomorrow_probability"] = round(1 - 2.718 ** (-h["tomorrow_predicted_count"] / 3.0), 4)
            h["next_week_predicted_count"] = round(h["tomorrow_predicted_count"] * 7, 2)
            h["next_week_probability"] = round(1 - 2.718 ** (-(h["next_week_predicted_count"]/7.0) / 2.5), 4)
            
    print(f"Merged forecasts for {merged_count} / {len(hotspots)} hotspots.")
    
    # 4. Save to MongoDB
    print("\nStep 4: Saving hotspots to MongoDB collection 'parking_hotspots'...")
    db.parking_hotspots.delete_many({}) # Clear old records
    
    if hotspots:
        # Generate string IDs for MongoDB
        for h in hotspots:
            h["_id"] = str(uuid.uuid4())
            h["created_at"] = datetime.utcnow()
            
        db.parking_hotspots.insert_many(hotspots)
        print(f"Successfully inserted {len(hotspots)} hotspots into DB!")
    else:
        print("Warning: No hotspots generated.")
        
    print("\nProcessing completed successfully!")

if __name__ == '__main__':
    main()
