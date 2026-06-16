import os
import sys
import uuid
from datetime import datetime

# Add app to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from backend.app.db.session import db
from backend.app.core.security import get_password_hash

def seed():
    print("Seeding MongoDB collections...")
    try:
        # Check if users already exist
        admin = db.users.find_one({"email": "admin@traffic.ai"})
        if not admin:
            print("Seeding default Administrator...")
            admin_user = {
                "_id": str(uuid.uuid4()),
                "email": "admin@traffic.ai",
                "hashed_password": get_password_hash("SecurePassword123!"),
                "full_name": "System Administrator",
                "role": "admin",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            db.users.insert_one(admin_user)
            
        scientist = db.users.find_one({"email": "scientist@traffic.ai"})
        if not scientist:
            print("Seeding default Data Scientist...")
            scientist_user = {
                "_id": str(uuid.uuid4()),
                "email": "scientist@traffic.ai",
                "hashed_password": get_password_hash("SecurePassword123!"),
                "full_name": "Sarah Connor",
                "role": "data_scientist",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            db.users.insert_one(scientist_user)
            
        print("Database seeded successfully in MongoDB!")
    except Exception as e:
        print(f"Error seeding database: {str(e)}")

if __name__ == '__main__':
    seed()
