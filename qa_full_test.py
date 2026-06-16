"""
==========================================================================
 COMPREHENSIVE QA TEST SUITE
 Senior QA Automation Engineer — Full System Audit
 Traffic Demand Prediction Platform
==========================================================================
Tests:
  1. BACKEND UNIT TESTS — Security, Pipeline, Geohash
  2. API INTEGRATION TESTS — Auth, Dataset, Training, Prediction endpoints
  3. ML PIPELINE TESTS — Training, Inference, Submission Validation
  4. DATA INTEGRITY TESTS — CSV structure, value ranges, index matching
  5. EDGE CASE / NEGATIVE TESTS — Bad auth, invalid input, boundary values
==========================================================================
"""
import os
import sys
import time
import json
import uuid
import unittest
import traceback
from datetime import timedelta

sys.path.insert(0, 'd:/Traffic_pridiction')

import requests
import numpy as np
import pandas as pd

from backend.app.core.security import (
    get_password_hash, verify_password,
    create_access_token, _decode_token,
    base64url_encode, base64url_decode,
)
from backend.app.ml.pipeline import (
    TrafficMLPipeline, decode_geohash,
    ROADTYPE_CATEGORIES, WEATHER_CATEGORIES,
)

BASE_URL = "http://localhost:8000"
API = f"{BASE_URL}/api/v1"

# ======================== HELPER ========================
def api_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ========================================================
#  1. BACKEND UNIT TESTS
# ========================================================
class TestSecurity(unittest.TestCase):
    """Password hashing, JWT creation/verification, edge cases."""

    def test_password_hash_and_verify(self):
        pwd = "SecurePassword123!"
        hashed = get_password_hash(pwd)
        self.assertNotEqual(pwd, hashed)
        self.assertTrue(verify_password(pwd, hashed))

    def test_wrong_password_rejected(self):
        hashed = get_password_hash("CorrectHorse")
        self.assertFalse(verify_password("WrongHorse", hashed))

    def test_empty_password_rejected(self):
        hashed = get_password_hash("CorrectHorse")
        self.assertFalse(verify_password("", hashed))

    def test_jwt_round_trip(self):
        payload = {"email": "qa@test.ai", "role": "admin"}
        token = create_access_token(data=payload, expires_delta=timedelta(minutes=10))
        decoded = _decode_token(token)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded["email"], "qa@test.ai")
        self.assertEqual(decoded["role"], "admin")

    def test_expired_jwt_rejected(self):
        payload = {"email": "qa@test.ai", "role": "admin"}
        token = create_access_token(data=payload, expires_delta=timedelta(minutes=-5))
        self.assertIsNone(_decode_token(token))

    def test_tampered_jwt_rejected(self):
        payload = {"email": "qa@test.ai", "role": "admin"}
        token = create_access_token(data=payload, expires_delta=timedelta(minutes=10))
        tampered = token[:-4] + "XXXX"
        self.assertIsNone(_decode_token(tampered))

    def test_malformed_jwt_rejected(self):
        self.assertIsNone(_decode_token("not.a.valid.token.at.all"))
        self.assertIsNone(_decode_token(""))
        self.assertIsNone(_decode_token("abc"))

    def test_base64_round_trip(self):
        data = b"Hello QA World"
        encoded = base64url_encode(data)
        decoded = base64url_decode(encoded)
        self.assertEqual(data, decoded)


class TestGeohash(unittest.TestCase):
    """Geohash decoding correctness."""

    def test_known_geohash(self):
        lat, lon = decode_geohash("qp02z1")
        self.assertTrue(-90.0 <= lat <= 90.0)
        self.assertTrue(-180.0 <= lon <= 180.0)

    def test_different_geohashes_give_different_coords(self):
        c1 = decode_geohash("qp02z1")
        c2 = decode_geohash("qp08b0")
        self.assertNotEqual(c1, c2)

    def test_empty_geohash(self):
        lat, lon = decode_geohash("")
        self.assertEqual(lat, 0.0)
        self.assertEqual(lon, 0.0)


class TestPipelinePreprocessing(unittest.TestCase):
    """Pipeline imputation and preprocessing logic."""

    def setUp(self):
        self.pipeline = TrafficMLPipeline()
        self.sample_df = pd.DataFrame({
            'geohash': ['qp02z1', 'qp02z1', 'qp02zt', 'qp08b0'],
            'day': [48, 48, 49, 50],
            'timestamp': ['2:15', '14:30', '22:00', '8:45'],
            'RoadType': ['Highway', None, 'Street', 'Residential'],
            'NumberofLanes': [3, 2, None, 4],
            'LargeVehicles': ['Allowed', 'Not Allowed', 'Allowed', None],
            'Landmarks': ['Yes', 'No', None, 'Yes'],
            'Temperature': [12.0, None, 22.5, 5.0],
            'Weather': ['Sunny', None, 'Rainy', 'Foggy'],
            'demand': [0.3, 0.5, 0.1, 0.8],
        })

    def test_fit_imputers_modes(self):
        self.pipeline.fit_imputers(self.sample_df)
        self.assertIn(self.pipeline.imputation_values['RoadType'], ROADTYPE_CATEGORIES)
        self.assertIn(self.pipeline.imputation_values['Weather'], WEATHER_CATEGORIES)
        self.assertIsInstance(self.pipeline.imputation_values['Temperature'], float)

    def test_preprocess_train_produces_features(self):
        features, enriched = self.pipeline.preprocess(self.sample_df, is_train=True)
        self.assertGreater(len(self.pipeline.feature_columns), 0)
        self.assertEqual(len(features), len(self.sample_df))
        # No NaN allowed in feature matrix
        feature_only = features[self.pipeline.feature_columns]
        self.assertFalse(feature_only.isna().any().any(), "NaN found in features after preprocessing")

    def test_preprocess_test_fills_missing(self):
        features, enriched = self.pipeline.preprocess(self.sample_df, is_train=True)
        test_df = pd.DataFrame({
            'Index': [0],
            'geohash': ['qp02z1'],
            'day': [49],
            'timestamp': ['10:00'],
            'RoadType': [None],
            'NumberofLanes': [None],
            'LargeVehicles': [None],
            'Landmarks': [None],
            'Temperature': [None],
            'Weather': [None],
        })
        test_features, _ = self.pipeline.preprocess(test_df, is_train=False)
        test_feat = test_features.reindex(columns=self.pipeline.feature_columns, fill_value=0.0)
        self.assertFalse(test_feat.isna().any().any(), "NaN found in test features after imputation")

    def test_one_hot_encoding_completeness(self):
        features, _ = self.pipeline.preprocess(self.sample_df, is_train=True)
        for cat in ROADTYPE_CATEGORIES:
            self.assertIn(f"RoadType_{cat}", features.columns)
        for cat in WEATHER_CATEGORIES:
            self.assertIn(f"Weather_{cat}", features.columns)


# ========================================================
#  2. API INTEGRATION TESTS (requires running server)
# ========================================================
class TestAPIIntegration(unittest.TestCase):
    """Tests against the live FastAPI backend on localhost:8000."""

    @classmethod
    def setUpClass(cls):
        # Check server is up
        try:
            r = requests.get(f"{BASE_URL}/", timeout=5)
            cls.server_up = r.status_code == 200
        except Exception:
            cls.server_up = False

        if cls.server_up:
            # Seed database
            try:
                requests.get(f"{BASE_URL}/", timeout=2)
                # Try seeding
                os.system('python -c "import sys; sys.path.insert(0,\'d:/Traffic_pridiction\'); from backend.app.seed_db import seed; seed()"')
            except Exception:
                pass

    def setUp(self):
        if not self.server_up:
            self.skipTest("Backend server not running")

    # --- Auth ---
    def test_root_endpoint(self):
        r = requests.get(f"{BASE_URL}/")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["status"], "online")
        self.assertIn("documentation", data)

    def test_docs_endpoint(self):
        r = requests.get(f"{BASE_URL}/docs")
        self.assertEqual(r.status_code, 200)

    def test_login_success(self):
        r = requests.post(f"{API}/auth/login", json={
            "email": "scientist@traffic.ai",
            "password": "SecurePassword123!"
        })
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={
            "email": "scientist@traffic.ai",
            "password": "WrongPassword!"
        })
        self.assertEqual(r.status_code, 401)

    def test_login_nonexistent_user(self):
        r = requests.post(f"{API}/auth/login", json={
            "email": "nobody@traffic.ai",
            "password": "whatever"
        })
        self.assertEqual(r.status_code, 401)

    def test_login_missing_fields(self):
        r = requests.post(f"{API}/auth/login", json={"email": "a@b.com"})
        self.assertIn(r.status_code, [400, 422])

    def test_auth_me_with_valid_token(self):
        token = self._get_token("scientist@traffic.ai")
        r = requests.get(f"{API}/auth/me", headers=api_headers(token))
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["email"], "scientist@traffic.ai")
        self.assertIn("id", data)
        self.assertIn("role", data)

    def test_auth_me_with_invalid_token(self):
        r = requests.get(f"{API}/auth/me", headers=api_headers("invalid_token_xyz"))
        self.assertIn(r.status_code, [401, 403, 500])

    def test_auth_me_without_token(self):
        r = requests.get(f"{API}/auth/me")
        self.assertIn(r.status_code, [401, 403, 422])

    # --- Register ---
    def test_register_new_user(self):
        uid = str(uuid.uuid4())[:8]
        r = requests.post(f"{API}/auth/register", json={
            "email": f"test_{uid}@traffic.ai",
            "password": "TestPass1234!",
            "full_name": f"QA Test User {uid}",
            "role": "viewer"
        })
        self.assertEqual(r.status_code, 201)
        data = r.json()
        self.assertEqual(data["role"], "viewer")

    def test_register_duplicate_email(self):
        r = requests.post(f"{API}/auth/register", json={
            "email": "scientist@traffic.ai",
            "password": "TestPass1234!",
            "full_name": "Dup User",
            "role": "viewer"
        })
        self.assertEqual(r.status_code, 400)

    # --- Datasets ---
    def test_list_datasets(self):
        token = self._get_token("scientist@traffic.ai")
        r = requests.get(f"{API}/datasets", headers=api_headers(token))
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    # --- Models leaderboard ---
    def test_model_leaderboard(self):
        token = self._get_token("scientist@traffic.ai")
        r = requests.get(f"{API}/models/leaderboard", headers=api_headers(token))
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    # --- Predictions list ---
    def test_predictions_list(self):
        token = self._get_token("scientist@traffic.ai")
        r = requests.get(f"{API}/predictions", headers=api_headers(token))
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    # --- Interactive prediction ---
    def test_interactive_prediction(self):
        token = self._get_token("scientist@traffic.ai")
        r = requests.post(f"{API}/predictions/interactive", headers=api_headers(token), json={
            "geohash": "qp02z1",
            "timestamp": "14:30",
            "weather": "Sunny",
            "temperature": 25.0,
            "road_type": "Highway",
            "num_lanes": 3,
            "large_vehicles": "Allowed",
            "landmarks": "Yes"
        })
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("prediction", data)
        self.assertIn("model", data)
        pred = data["prediction"]
        self.assertGreaterEqual(pred, 0.0)
        self.assertLessEqual(pred, 1.0)

    def test_interactive_prediction_different_inputs(self):
        token = self._get_token("scientist@traffic.ai")
        inputs = [
            {"geohash": "qp02z1", "timestamp": "2:15", "weather": "Rainy",
             "temperature": 5.0, "road_type": "Residential", "num_lanes": 1,
             "large_vehicles": "Not Allowed", "landmarks": "No"},
            {"geohash": "qp08b0", "timestamp": "18:00", "weather": "Snowy",
             "temperature": -2.0, "road_type": "Highway", "num_lanes": 4,
             "large_vehicles": "Allowed", "landmarks": "Yes"},
            {"geohash": "qp02zt", "timestamp": "12:00", "weather": "Foggy",
             "temperature": 30.0, "road_type": "Street", "num_lanes": 2,
             "large_vehicles": "Not Allowed", "landmarks": "No"},
        ]
        predictions = []
        for inp in inputs:
            r = requests.post(f"{API}/predictions/interactive",
                              headers=api_headers(token), json=inp)
            self.assertEqual(r.status_code, 200)
            pred = r.json()["prediction"]
            self.assertGreaterEqual(pred, 0.0)
            self.assertLessEqual(pred, 1.0)
            predictions.append(pred)
        # Ensure model gives varied predictions, not constant
        self.assertGreater(len(set(predictions)), 1, "All interactive predictions are identical")

    # --- Admin audit logs ---
    def test_audit_logs_admin(self):
        token = self._get_token("admin@traffic.ai")
        r = requests.get(f"{API}/admin/audit-logs", headers=api_headers(token))
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_audit_logs_non_admin_forbidden(self):
        token = self._get_token("scientist@traffic.ai")
        r = requests.get(f"{API}/admin/audit-logs", headers=api_headers(token))
        self.assertEqual(r.status_code, 403)

    # --- Explain endpoints ---
    def test_explain_local_shap(self):
        token = self._get_token("scientist@traffic.ai")
        r = requests.get(f"{API}/explain/shap/local", headers=api_headers(token),
                         params={"model_id": "dummy", "geohash": "qp02z1", "timestamp": "14:30"})
        # Should return 404 for dummy model but not crash
        self.assertIn(r.status_code, [200, 404])

    # --- Helper ---
    def _get_token(self, email, password="SecurePassword123!"):
        r = requests.post(f"{API}/auth/login", json={"email": email, "password": password})
        return r.json()["access_token"]


# ========================================================
#  3. ML PIPELINE END-TO-END TESTS
# ========================================================
class TestMLPipelineE2E(unittest.TestCase):
    """Full pipeline: load model, predict, validate output."""

    @classmethod
    def setUpClass(cls):
        cls.model_dir = 'd:/Traffic_pridiction/backend/data/models'
        cls.test_path = 'd:/Traffic_pridiction/e88186124ec611f1/dataset/test.csv'
        cls.train_path = 'd:/Traffic_pridiction/e88186124ec611f1/dataset/train.csv'
        cls.pipeline = TrafficMLPipeline()
        cls.pipeline.load_pipeline(cls.model_dir)

    def test_model_loaded(self):
        self.assertIsNotNone(self.pipeline.best_model)
        self.assertIsNotNone(self.pipeline.best_model_name)
        self.assertGreater(len(self.pipeline.feature_columns), 0)

    def test_champion_model_name(self):
        self.assertEqual(self.pipeline.best_model_name, "LightGBM")

    def test_feature_count(self):
        self.assertEqual(len(self.pipeline.feature_columns), 22)

    def test_predict_test_shape(self):
        submission = self.pipeline.predict_test(self.test_path, self.model_dir)
        test_df = pd.read_csv(self.test_path)
        self.assertEqual(len(submission), len(test_df))
        self.assertListEqual(list(submission.columns), ["Index", "demand"])

    def test_predict_test_value_range(self):
        submission = self.pipeline.predict_test(self.test_path, self.model_dir)
        self.assertGreaterEqual(submission["demand"].min(), 0.0)
        self.assertLessEqual(submission["demand"].max(), 1.0)

    def test_predict_test_no_nan(self):
        submission = self.pipeline.predict_test(self.test_path, self.model_dir)
        self.assertFalse(submission["demand"].isna().any())
        self.assertFalse(np.isinf(submission["demand"]).any())

    def test_predict_interactive_range(self):
        pred = self.pipeline.predict_interactive({
            "geohash": "qp02z1",
            "day": 49,
            "timestamp": "14:30",
            "road_type": "Highway",
            "num_lanes": 3,
            "large_vehicles": "Allowed",
            "landmarks": "Yes",
            "temperature": 25.0,
            "weather": "Sunny",
        })
        self.assertGreaterEqual(pred, 0.0)
        self.assertLessEqual(pred, 1.0)

    def test_predict_interactive_sensitivity(self):
        """Highway should produce different demand than Residential."""
        pred_highway = self.pipeline.predict_interactive({
            "geohash": "qp02z1", "day": 49, "timestamp": "14:30",
            "road_type": "Highway", "num_lanes": 3,
            "large_vehicles": "Allowed", "landmarks": "Yes",
            "temperature": 25.0, "weather": "Sunny",
        })
        pred_residential = self.pipeline.predict_interactive({
            "geohash": "qp02z1", "day": 49, "timestamp": "14:30",
            "road_type": "Residential", "num_lanes": 1,
            "large_vehicles": "Not Allowed", "landmarks": "No",
            "temperature": 25.0, "weather": "Sunny",
        })
        # Must differ (model is sensitive to road type)
        self.assertNotAlmostEqual(pred_highway, pred_residential, places=4)

    def test_predict_interactive_time_sensitivity(self):
        """Rush hour vs midnight should produce different predictions."""
        pred_rush = self.pipeline.predict_interactive({
            "geohash": "qp08b0", "day": 50, "timestamp": "17:00",
            "road_type": "Highway", "num_lanes": 4,
            "large_vehicles": "Allowed", "landmarks": "Yes",
            "temperature": 20.0, "weather": "Sunny",
        })
        pred_midnight = self.pipeline.predict_interactive({
            "geohash": "qp08b0", "day": 50, "timestamp": "3:00",
            "road_type": "Highway", "num_lanes": 4,
            "large_vehicles": "Allowed", "landmarks": "Yes",
            "temperature": 20.0, "weather": "Sunny",
        })
        self.assertNotAlmostEqual(pred_rush, pred_midnight, places=4)


# ========================================================
#  4. SUBMISSION CSV VALIDATION
# ========================================================
class TestSubmissionCSV(unittest.TestCase):
    """Validate the submission.csv matches competition requirements."""

    @classmethod
    def setUpClass(cls):
        cls.submission = pd.read_csv('d:/Traffic_pridiction/backend/data/predictions/submission.csv')
        cls.sample = pd.read_csv('d:/Traffic_pridiction/e88186124ec611f1/dataset/sample_submission.csv')
        cls.test = pd.read_csv('d:/Traffic_pridiction/e88186124ec611f1/dataset/test.csv')
        cls.predictions_copy = pd.read_csv('d:/Traffic_pridiction/e88186124ec611f1/dataset/predictions.csv')

    def test_columns_match_sample(self):
        self.assertListEqual(list(self.submission.columns), list(self.sample.columns))

    def test_row_count_matches_test(self):
        self.assertEqual(len(self.submission), len(self.test))

    def test_indices_match_test(self):
        np.testing.assert_array_equal(
            sorted(self.submission['Index'].values),
            sorted(self.test['Index'].values)
        )

    def test_index_order_matches_test(self):
        np.testing.assert_array_equal(
            self.submission['Index'].values,
            self.test['Index'].values
        )

    def test_no_duplicate_indices(self):
        self.assertEqual(self.submission['Index'].duplicated().sum(), 0)

    def test_demand_dtype(self):
        self.assertEqual(self.submission['demand'].dtype, np.float64)

    def test_no_nan(self):
        self.assertFalse(self.submission['demand'].isna().any())

    def test_no_inf(self):
        self.assertFalse(np.isinf(self.submission['demand']).any())

    def test_demand_in_range(self):
        self.assertGreaterEqual(self.submission['demand'].min(), 0.0)
        self.assertLessEqual(self.submission['demand'].max(), 1.0)

    def test_not_constant(self):
        self.assertGreater(self.submission['demand'].nunique(), 100)

    def test_reasonable_distribution(self):
        mean = self.submission['demand'].mean()
        self.assertGreater(mean, 0.01, "Mean too low, likely degenerate predictions")
        self.assertLess(mean, 0.9, "Mean too high, likely degenerate predictions")

    def test_submission_matches_copy(self):
        """Submission and the dataset copy should be identical."""
        np.testing.assert_array_almost_equal(
            self.submission['demand'].values,
            self.predictions_copy['demand'].values,
            decimal=12
        )


# ========================================================
#  5. MODEL ARTIFACTS TESTS
# ========================================================
class TestModelArtifacts(unittest.TestCase):
    """Verify all model artifacts exist and are valid."""

    def test_pipeline_joblib_exists(self):
        self.assertTrue(os.path.exists('d:/Traffic_pridiction/backend/data/models/traffic_pipeline.joblib'))

    def test_model_joblib_exists(self):
        self.assertTrue(os.path.exists('d:/Traffic_pridiction/backend/data/models/champion_model.joblib'))

    def test_report_json_exists(self):
        path = 'd:/Traffic_pridiction/backend/data/models/model_comparison_report.json'
        self.assertTrue(os.path.exists(path))
        with open(path, 'r') as f:
            report = json.load(f)
        self.assertIn('best_model', report)
        self.assertIn('metrics', report)
        self.assertIn('shap_importance', report)
        self.assertEqual(report['best_model'], 'LightGBM')

    def test_report_metrics_valid(self):
        with open('d:/Traffic_pridiction/backend/data/models/model_comparison_report.json', 'r') as f:
            report = json.load(f)
        for model_name, metrics in report['metrics'].items():
            self.assertIn('r2', metrics)
            self.assertIn('mae', metrics)
            self.assertIn('rmse', metrics)
            self.assertGreater(metrics['r2'], 0.5, f"{model_name} R2 too low")
            self.assertLess(metrics['mae'], 0.2, f"{model_name} MAE too high")
            self.assertLess(metrics['rmse'], 0.2, f"{model_name} RMSE too high")

    def test_submission_csv_exists(self):
        self.assertTrue(os.path.exists('d:/Traffic_pridiction/backend/data/predictions/submission.csv'))

    def test_train_data_exists(self):
        self.assertTrue(os.path.exists('d:/Traffic_pridiction/e88186124ec611f1/dataset/train.csv'))

    def test_test_data_exists(self):
        self.assertTrue(os.path.exists('d:/Traffic_pridiction/e88186124ec611f1/dataset/test.csv'))


# ========================================================
#  RUNNER
# ========================================================
if __name__ == '__main__':
    # Custom test runner for clean output
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    test_classes = [
        TestSecurity,
        TestGeohash,
        TestPipelinePreprocessing,
        TestMLPipelineE2E,
        TestSubmissionCSV,
        TestModelArtifacts,
        TestAPIIntegration,
    ]

    for cls in test_classes:
        suite.addTests(loader.loadTestsFromTestCase(cls))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Summary
    print("\n" + "=" * 70)
    print("QA TEST SUMMARY")
    print("=" * 70)
    print(f"  Tests Run:     {result.testsRun}")
    print(f"  Passed:        {result.testsRun - len(result.failures) - len(result.errors) - len(result.skipped)}")
    print(f"  Failed:        {len(result.failures)}")
    print(f"  Errors:        {len(result.errors)}")
    print(f"  Skipped:       {len(result.skipped)}")
    status = "ALL TESTS PASSED" if result.wasSuccessful() else "SOME TESTS FAILED"
    print(f"  Overall:       {status}")
    print("=" * 70)
