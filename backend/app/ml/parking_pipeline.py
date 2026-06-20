import os
import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.ensemble import ExtraTreesRegressor
from typing import Dict, Any, List, Tuple
from pymongo import MongoClient

class ParkingMLPipeline:
    """
    ML Pipeline for Parking Intelligence & Congestion Impact:
    - Geospatial clustering of violations (DBSCAN)
    - Congestion scoring & road capacity reduction estimation
    - Hotspot forecasting (predict tomorrow and next week)
    - Enforcement recommendations and simulator
    """
    def __init__(self):
        self.model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/models/parking_forecast_model.joblib"))
        self.forecaster = None

    def encode_geohash(self, latitude: float, longitude: float, precision: int = 6) -> str:
        """Encode a coordinate into a 6-character geohash."""
        base32 = "0123456789bcdefghjkmnpqrstuvwxyz"
        lat_interval = (-90.0, 90.0)
        lon_interval = (-180.0, 180.0)
        geohash = []
        bits = 0
        val = 0
        is_even = True
        while len(geohash) < precision:
            if is_even:
                mid = (lon_interval[0] + lon_interval[1]) / 2
                if longitude > mid:
                    val = (val << 1) + 1
                    lon_interval = (mid, lon_interval[1])
                else:
                    val = (val << 1)
                    lon_interval = (lon_interval[0], mid)
            else:
                mid = (lat_interval[0] + lat_interval[1]) / 2
                if latitude > mid:
                    val = (val << 1) + 1
                    lat_interval = (mid, lat_interval[1])
                else:
                    val = (val << 1)
                    lat_interval = (lat_interval[0], mid)
            is_even = not is_even
            bits += 1
            if bits == 5:
                geohash.append(base32[val])
                bits = 0
                val = 0
        return "".join(geohash)

    def process_and_cluster(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Load parking violation dataset, perform geospatial clustering using DBSCAN,
        and compute features for each hotspot.
        """
        print("Loading parking dataset...")
        df = pd.read_csv(file_path)
        
        # Ensure timestamp formats and date objects
        df["created_datetime"] = pd.to_datetime(df["created_datetime"], errors="coerce")
        df = df.dropna(subset=["latitude", "longitude", "created_datetime"])
        
        # Round coordinates for initial grouping to speed up DBSCAN
        df["lat_round"] = df["latitude"].round(4)
        df["lon_round"] = df["longitude"].round(4)
        
        # Add geohash
        df["geohash"] = df.apply(lambda row: self.encode_geohash(row["latitude"], row["longitude"]), axis=1)
        
        # Group by rounded coordinates to count violations at each point
        loc_counts = df.groupby(["lat_round", "lon_round"]).size().reset_index(name="v_count")
        
        # Filter active locations to cluster (at least 5 violations)
        active_locs = loc_counts[loc_counts["v_count"] >= 5].copy()
        
        if len(active_locs) < 3:
            print("Not enough active locations for DBSCAN. Fallback to geohash grouping.")
            # Fallback mock/simplified clusters if needed
            return []
            
        coords = active_locs[["lat_round", "lon_round"]].values
        
        # Fit DBSCAN (eps=0.001 is ~110m, min_samples=3 rounded points)
        print("Running DBSCAN geospatial clustering...")
        db = DBSCAN(eps=0.001, min_samples=3, metric="euclidean")
        active_locs["cluster"] = db.fit_predict(coords)
        
        # Map back to raw data
        df = df.merge(active_locs[["lat_round", "lon_round", "cluster"]], on=["lat_round", "lon_round"], how="left")
        df["cluster"] = df["cluster"].fillna(-1).astype(int)
        
        # Filter out noise (-1)
        clustered_df = df[df["cluster"] != -1]
        
        # Max date in dataset
        max_date = df["created_datetime"].max()
        cutoff_30d = max_date - pd.Timedelta(days=30)
        
        hotspots = []
        unique_clusters = clustered_df["cluster"].unique()
        print(f"Detected {len(unique_clusters)} parking hotspots.")
        
        for c in unique_clusters:
            c_data = clustered_df[clustered_df["cluster"] == c]
            total_violations = len(c_data)
            
            # Find centroid
            lat_center = float(c_data["latitude"].mean())
            lon_center = float(c_data["longitude"].mean())
            geohash_center = self.encode_geohash(lat_center, lon_center)
            
            # Location details
            location_name = str(c_data["location"].mode(dropna=True).iloc[0]) if not c_data["location"].dropna().empty else "Unknown Street"
            police_station = str(c_data["police_station"].mode(dropna=True).iloc[0]) if not c_data["police_station"].dropna().empty else "Unknown Station"
            junction_name = str(c_data["junction_name"].mode(dropna=True).iloc[0]) if not c_data["junction_name"].dropna().empty else "No Junction"
            
            # Violation types distribution
            v_types = c_data["violation_type"].value_counts().head(5).to_dict()
            predominant_v = max(v_types, key=v_types.get) if v_types else "UNKNOWN"
            
            # Vehicle types distribution
            veh_types = c_data["vehicle_type"].value_counts().to_dict()
            
            # Emerging logic (ratio of last 30 days vs previous)
            recent_count = len(c_data[c_data["created_datetime"] >= cutoff_30d])
            past_count = total_violations - recent_count
            growth_rate = 0.0
            if past_count > 0:
                growth_rate = (recent_count / 30.0) / (past_count / 120.0) # Daily rate ratio
                
            # Classify hotspot type
            if "WRONG PARKING" in predominant_v:
                category = "Wrong Parking Hotspot"
            elif growth_rate > 1.8 and recent_count > 10:
                category = "Emerging Hotspot"
            else:
                category = "Illegal Parking Hotspot"
                
            # Calculate Hotspot Score (0 - 100)
            # Based on size, validation status, and recent trends
            validation_rate = 1.0
            val_counts = c_data["validation_status"].value_counts()
            if "approved" in val_counts:
                validation_rate = val_counts["approved"] / val_counts.sum()
                
            hotspot_score = min(100.0, float(total_violations / 4.0 * validation_rate + growth_rate * 5))
            
            # Congestion Impact Engine calculations
            # 1. Road capacity reduction estimate
            total_veh = sum(veh_types.values())
            car_cnt = veh_types.get("CAR", 0) + veh_types.get("MAXI-CAB", 0)
            bus_cnt = veh_types.get("PRIVATE BUS", 0) + veh_types.get("LGV", 0) + veh_types.get("GOODS AUTO", 0)
            scooter_cnt = veh_types.get("SCOOTER", 0) + veh_types.get("MOTOR CYCLE", 0) + veh_types.get("MOPED", 0)
            
            p_cars = car_cnt / total_veh if total_veh else 0
            p_bus = bus_cnt / total_veh if total_veh else 0
            p_scooters = scooter_cnt / total_veh if total_veh else 0
            
            road_reduction = min(85.0, float(p_scooters * 15 + p_cars * 40 + p_bus * 75))
            
            # 2. Junction Risk
            near_junction = 1 if junction_name != "No Junction" else 0
            if near_junction and total_violations > 50:
                junction_risk = "Critical"
            elif near_junction:
                junction_risk = "High"
            elif total_violations > 100:
                junction_risk = "Medium"
            else:
                junction_risk = "Low"
                
            # 3. Congestion Impact Score (0 - 100)
            congestion_score = min(100.0, float(
                total_violations / 5.0 + 
                (25.0 if near_junction else 0.0) + 
                (20.0 if "MAIN ROAD" in predominant_v or "Main Road" in location_name else 0.0) +
                p_bus * 30
            ))
            
            # Determine Level
            if congestion_score >= 80:
                congestion_level = "Critical"
            elif congestion_score >= 60:
                congestion_level = "High"
            elif congestion_score >= 30:
                congestion_level = "Medium"
            else:
                congestion_level = "Low"
                
            # Recommendations
            # Priority Rank
            priority_rank = congestion_level
            # Suggested Officers
            if priority_rank == "Critical":
                officers = 5
            elif priority_rank == "High":
                officers = 4
            elif priority_rank == "Medium":
                officers = 2
            else:
                officers = 1
                
            # Expected Improvement (%)
            exp_improvement = min(45, int(15 + officers * 6 + (10 if category == "Emerging Hotspot" else 0)))
            
            # Generate transparent explainable reason
            reasons = []
            if junction_name != "No Junction":
                reasons.append(f"Located near high-risk intersection ({junction_name}).")
            if road_reduction > 25:
                reasons.append(f"Reduces traffic capacity by {round(road_reduction, 1)}%.")
            if growth_rate > 1.4:
                reasons.append(f"Violation growth is up {round(growth_rate, 1)}x.")
            reasons.append(f"Primary issue: {predominant_v.replace('_', ' ').title()}.")
            explainable_reason = " ".join(reasons)

            hotspots.append({
                "cluster_id": int(c),
                "latitude": lat_center,
                "longitude": lon_center,
                "geohash": geohash_center,
                "location": location_name,
                "police_station": police_station,
                "junction_name": junction_name,
                "total_violations": total_violations,
                "recent_violations_30d": recent_count,
                "growth_rate": growth_rate,
                "hotspot_score": round(hotspot_score, 1),
                "category": category,
                "predominant_violation": predominant_v,
                "violation_distribution": v_types,
                "vehicle_distribution": veh_types,
                "road_capacity_reduction": round(road_reduction, 1),
                "junction_risk": junction_risk,
                "congestion_score": round(congestion_score, 1),
                "congestion_level": congestion_level,
                "enforcement_priority": priority_rank,
                "suggested_officers": officers,
                "expected_improvement_pct": exp_improvement,
                "explainable_reason": explainable_reason
            })
            
        return hotspots

    def train_forecaster(self, file_path: str):
        """
        Train a time-series model (ExtraTreesRegressor) on parking violations.
        Predicts future violation counts for geohashes.
        """
        print("Training forecasting model for parking hotspots...")
        df = pd.read_csv(file_path)
        df["created_datetime"] = pd.to_datetime(df["created_datetime"], errors="coerce")
        df = df.dropna(subset=["latitude", "longitude", "created_datetime"])
        
        # Add geohash and day index
        df["geohash"] = df.apply(lambda row: self.encode_geohash(row["latitude"], row["longitude"]), axis=1)
        min_date = df["created_datetime"].min().date()
        df["day_idx"] = (df["created_datetime"].dt.date - min_date).apply(lambda x: x.days)
        
        # Group by geohash and day to get daily counts
        daily_counts = df.groupby(["geohash", "day_idx"]).size().reset_index(name="violation_count")
        
        # Only keep active geohashes (with at least 15 violations overall)
        geohash_totals = daily_counts.groupby("geohash")["violation_count"].sum().reset_index(name="total")
        active_geohashes = geohash_totals[geohash_totals["total"] >= 15]["geohash"].tolist()
        
        daily_counts = daily_counts[daily_counts["geohash"].isin(active_geohashes)]
        
        if len(daily_counts) < 100:
            print("Insufficient data for training forecaster. Skipping model fit.")
            return
            
        # Reindex to fill missing days with 0 for each geohash
        max_day = daily_counts["day_idx"].max()
        all_days = list(range(max_day + 1))
        
        records = []
        for g in active_geohashes:
            g_data = daily_counts[daily_counts["geohash"] == g].set_index("day_idx")
            for day in all_days:
                count = int(g_data.loc[day, "violation_count"]) if day in g_data.index else 0
                records.append({"geohash": g, "day_idx": day, "count": count})
                
        time_series_df = pd.DataFrame(records)
        
        # Build features: lags, rolling means
        time_series_df["day_of_week"] = time_series_df["day_idx"] % 7
        
        # Build lags using pandas shift
        time_series_df = time_series_df.sort_values(["geohash", "day_idx"])
        time_series_df["lag_1"] = time_series_df.groupby("geohash")["count"].shift(1).fillna(0)
        time_series_df["lag_7"] = time_series_df.groupby("geohash")["count"].shift(7).fillna(0)
        time_series_df["rolling_mean_7"] = time_series_df.groupby("geohash")["count"].shift(1).rolling(window=7, min_periods=1).mean().fillna(0).reset_index(level=0, drop=True)
        
        # Drop rows where lag features aren't fully formed (first 7 days)
        train_data = time_series_df[time_series_df["day_idx"] >= 7]
        
        X = train_data[["day_of_week", "lag_1", "lag_7", "rolling_mean_7"]].values
        y = train_data["count"].values
        
        # Train ExtraTrees model (part of existing framework)
        self.forecaster = ExtraTreesRegressor(n_estimators=100, max_depth=8, random_state=42)
        self.forecaster.fit(X, y)
        
        # Save model
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.forecaster, self.model_path)
        print("Forecasting model trained and saved successfully.")

    def forecast_hotspots(self, file_path: str) -> Dict[str, Dict[str, float]]:
        """
        Generates tomorrow and next week forecasts for all active geohashes.
        Returns hotspot probabilities.
        """
        if self.forecaster is None:
            if os.path.exists(self.model_path):
                self.forecaster = joblib.load(self.model_path)
            else:
                self.train_forecaster(file_path)
                
        # Re-load data to get the latest lag values
        df = pd.read_csv(file_path)
        df["created_datetime"] = pd.to_datetime(df["created_datetime"], errors="coerce")
        df = df.dropna(subset=["latitude", "longitude", "created_datetime"])
        df["geohash"] = df.apply(lambda row: self.encode_geohash(row["latitude"], row["longitude"]), axis=1)
        min_date = df["created_datetime"].min().date()
        df["day_idx"] = (df["created_datetime"].dt.date - min_date).apply(lambda x: x.days)
        
        daily_counts = df.groupby(["geohash", "day_idx"]).size().reset_index(name="violation_count")
        
        max_day = daily_counts["day_idx"].max()
        active_geohashes = daily_counts.groupby("geohash")["violation_count"].sum().reset_index(name="total")
        active_geohashes = active_geohashes[active_geohashes["total"] >= 15]["geohash"].tolist()
        
        forecasts = {}
        
        # Run predictions for each geohash
        for g in active_geohashes:
            g_data = daily_counts[daily_counts["geohash"] == g].set_index("day_idx")
            
            # Reconstruct the time series up to max_day
            counts_series = [int(g_data.loc[day, "violation_count"]) if day in g_data.index else 0 for day in range(max_day + 1)]
            
            # Predict Tomorrow (day max_day + 1)
            tomorrow_day_idx = max_day + 1
            tomorrow_dow = tomorrow_day_idx % 7
            tomorrow_lag_1 = counts_series[-1]
            tomorrow_lag_7 = counts_series[-7] if len(counts_series) >= 7 else 0
            tomorrow_roll7 = np.mean(counts_series[-7:]) if len(counts_series) >= 7 else np.mean(counts_series)
            
            features_tomorrow = np.array([[tomorrow_dow, tomorrow_lag_1, tomorrow_lag_7, tomorrow_roll7]])
            pred_tomorrow = float(self.forecaster.predict(features_tomorrow)[0]) if self.forecaster else tomorrow_roll7
            
            # Predict Next Week (average of next 7 days in recursive fashion)
            pred_week_sum = 0.0
            temp_series = list(counts_series)
            
            for i in range(1, 8):
                pred_day_idx = max_day + i
                pred_dow = pred_day_idx % 7
                pred_lag_1 = temp_series[-1]
                pred_lag_7 = temp_series[-7] if len(temp_series) >= 7 else 0
                pred_roll7 = np.mean(temp_series[-7:]) if len(temp_series) >= 7 else np.mean(temp_series)
                
                features_day = np.array([[pred_dow, pred_lag_1, pred_lag_7, pred_roll7]])
                pred_day = float(self.forecaster.predict(features_day)[0]) if self.forecaster else pred_roll7
                pred_week_sum += pred_day
                temp_series.append(int(round(pred_day))) # Append prediction for next lag
                
            # Convert counts to probability using sigmoid-like scaling
            prob_tomorrow = float(1.0 - np.exp(-pred_tomorrow / 3.0))
            prob_week = float(1.0 - np.exp(-(pred_week_sum / 7.0) / 2.5))
            
            forecasts[g] = {
                "tomorrow_predicted_count": round(pred_tomorrow, 2),
                "tomorrow_probability": round(prob_tomorrow, 4),
                "next_week_predicted_count": round(pred_week_sum, 2),
                "next_week_probability": round(prob_week, 4)
            }
            
        return forecasts

    def simulate_enforcement(self, hotspot: Dict[str, Any], additional_officers: int) -> Dict[str, Any]:
        """
        Simulate the impact of deploying more enforcement officers to a hotspot.
        Estimate violation reduction, congestion reduction, and expected improvements.
        """
        if additional_officers <= 0:
            return {
                "violation_reduction_pct": 0.0,
                "congestion_reduction_pct": 0.0,
                "new_congestion_score": hotspot["congestion_score"],
                "new_congestion_level": hotspot["congestion_level"],
                "impact_status": "No Change"
            }
            
        # Heuristics based on literature: each additional officer reduces violations.
        # Diminishing returns modeled via logarithmic scale.
        officer_factor = min(1.0, np.log1p(additional_officers) / np.log1p(6))
        
        # Max reduction is 85% for illegal parking, 70% for wrong parking, 90% for emerging
        max_reduction = 0.85
        if hotspot["category"] == "Wrong Parking Hotspot":
            max_reduction = 0.70
        elif hotspot["category"] == "Emerging Hotspot":
            max_reduction = 0.90
            
        violation_reduction = round(max_reduction * officer_factor * 100.0, 1)
        
        # Congestion reduction is slightly less than violation reduction due to baseline traffic.
        congestion_reduction = round(violation_reduction * 0.75, 1)
        
        old_score = hotspot["congestion_score"]
        new_score = max(5.0, round(old_score * (1.0 - congestion_reduction / 100.0), 1))
        
        # Recalculate level
        if new_score >= 80:
            new_level = "Critical"
        elif new_score >= 60:
            new_level = "High"
        elif new_score >= 30:
            new_level = "Medium"
        else:
            new_level = "Low"
            
        improvement_status = "Significant Improvement" if congestion_reduction >= 30 else "Moderate Improvement"
        if congestion_reduction >= 50:
            improvement_status = "Optimal Enforcement"
            
        return {
            "violation_reduction_pct": violation_reduction,
            "congestion_reduction_pct": congestion_reduction,
            "new_congestion_score": new_score,
            "new_congestion_level": new_level,
            "impact_status": improvement_status
        }
