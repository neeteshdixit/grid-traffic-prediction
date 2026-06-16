import os
import sys
import unittest
from datetime import timedelta

# Add app to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.app.core.security import get_password_hash, verify_password, create_access_token, _decode_token
from backend.app.ml.pipeline import decode_geohash, TrafficMLPipeline

class TestTrafficPredictionSystem(unittest.TestCase):
    
    def test_geohash_decoding(self):
        # Decode known geohash and verify bounds
        lat, lon = decode_geohash("qp02z1")
        self.assertTrue(-90.0 <= lat <= 90.0)
        self.assertTrue(-180.0 <= lon <= 180.0)
        
    def test_password_hashing(self):
        password = "SecurePassword123!"
        hashed = get_password_hash(password)
        self.assertNotEqual(password, hashed)
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("wrong_password", hashed))
        
    def test_jwt_token_flow(self):
        payload = {"email": "scientist@traffic.ai", "role": "data_scientist"}
        token = create_access_token(data=payload, expires_delta=timedelta(minutes=5))
        
        decoded = _decode_token(token)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded["email"], "scientist@traffic.ai")
        self.assertEqual(decoded["role"], "data_scientist")
        
    def test_jwt_expired_token(self):
        payload = {"email": "scientist@traffic.ai", "role": "data_scientist"}
        # Create token that expired 5 minutes ago
        token = create_access_token(data=payload, expires_delta=timedelta(minutes=-5))
        
        decoded = _decode_token(token)
        self.assertIsNone(decoded)

    def test_pipeline_imputers(self):
        # Create dummy df
        import pandas as pd
        data = {
            'geohash': ['qp02z1', 'qp02z1', 'qp02zt'],
            'RoadType': ['Highway', None, 'Street'],
            'Weather': ['Sunny', 'Sunny', None],
            'Temperature': [12.0, 14.0, None],
            'LargeVehicles': ['Allowed', 'Allowed', 'Not Allowed'],
            'Landmarks': ['Yes', 'No', 'No'],
            'day': [48, 48, 48],
            'timestamp': ['2:15', '2:30', '2:45']
        }
        df = pd.DataFrame(data)
        pipeline = TrafficMLPipeline()
        pipeline.fit_imputers(df)
        
        self.assertEqual(pipeline.imputation_values['RoadType'], 'Highway')
        self.assertEqual(pipeline.imputation_values['Weather'], 'Sunny')
        self.assertEqual(pipeline.imputation_values['Temperature'], 13.0)

if __name__ == '__main__':
    unittest.main()
