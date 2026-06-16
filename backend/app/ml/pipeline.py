import os
import json
import joblib
from functools import lru_cache
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, ExtraTreesRegressor, HistGradientBoostingRegressor, VotingRegressor
from sklearn.linear_model import Ridge, Lasso
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold

import xgboost as xgb

try:
    import lightgbm as lgb

    LGBM_AVAILABLE = True
except ImportError:
    LGBM_AVAILABLE = False

try:
    from catboost import CatBoostRegressor

    CATBOOST_AVAILABLE = True
except ImportError:
    CATBOOST_AVAILABLE = False

try:
    import shap

    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False


ROADTYPE_CATEGORIES = ["Highway", "Residential", "Street"]
WEATHER_CATEGORIES = ["Foggy", "Rainy", "Snowy", "Sunny"]


@lru_cache(maxsize=8192)
def decode_geohash(geohash: str) -> Tuple[float, float]:
    """Decode a geohash into its latitude/longitude center."""
    base32 = "0123456789bcdefghjkmnpqrstuvwxyz"
    lat_interval = (-90.0, 90.0)
    lon_interval = (-180.0, 180.0)
    is_even = True

    for char in str(geohash):
        if char not in base32:
            continue
        val = base32.index(char)
        for i in range(4, -1, -1):
            bit = (val >> i) & 1
            if is_even:
                mid = (lon_interval[0] + lon_interval[1]) / 2
                lon_interval = (mid, lon_interval[1]) if bit else (lon_interval[0], mid)
            else:
                mid = (lat_interval[0] + lat_interval[1]) / 2
                lat_interval = (mid, lat_interval[1]) if bit else (lat_interval[0], mid)
            is_even = not is_even

    lat = (lat_interval[0] + lat_interval[1]) / 2
    lon = (lon_interval[0] + lon_interval[1]) / 2
    return lat, lon


def _safe_mode(series: pd.Series, default: str) -> str:
    values = series.dropna()
    if values.empty:
        return default
    modes = values.mode(dropna=True)
    if modes.empty:
        return default
    return str(modes.iloc[0])


def _safe_float(value: Any, default: float) -> float:
    try:
        if value is None or (isinstance(value, float) and np.isnan(value)):
            return float(default)
        return float(value)
    except Exception:
        return float(default)


class TrafficMLPipeline:
    """
    Leakage-safe traffic demand pipeline with:
    - spatial decoding
    - temporal features
    - geohash/day/hour target encodings
    - grouped cross-validation
    - champion model selection
    - SHAP explainability export
    """

    def __init__(self):
        self.version = "2.0"
        self.imputation_values: Dict[str, Any] = {}
        self.statistics: Dict[str, Any] = {}
        self.best_model_name: Optional[str] = None
        self.best_model: Any = None
        self.feature_columns: List[str] = []
        self.global_target_mean: float = 0.0

    # ------------------------------------------------------------------
    # Base feature engineering
    # ------------------------------------------------------------------
    def _prepare_base_frame(self, df: pd.DataFrame) -> pd.DataFrame:
        frame = df.copy()

        if "geohash" in frame.columns:
            frame["geohash"] = frame["geohash"].astype(str).str.lower()
            coords = frame["geohash"].map(decode_geohash)
            frame["latitude"] = coords.map(lambda item: item[0]).astype(float)
            frame["longitude"] = coords.map(lambda item: item[1]).astype(float)
            frame["geohash_prefix4"] = frame["geohash"].str[:4]
        else:
            frame["latitude"] = 0.0
            frame["longitude"] = 0.0
            frame["geohash_prefix4"] = "0000"

        if "timestamp" in frame.columns:
            time_parts = frame["timestamp"].astype(str).str.strip().str.split(":", n=1, expand=True)
            if time_parts.shape[1] == 1:
                time_parts[1] = "0"
            frame["hour"] = pd.to_numeric(time_parts[0], errors="coerce").fillna(0).astype(int)
            frame["minute"] = pd.to_numeric(time_parts[1], errors="coerce").fillna(0).astype(int)
        else:
            frame["hour"] = 0
            frame["minute"] = 0

        frame["minute_of_day"] = frame["hour"] * 60 + frame["minute"]
        frame["sin_time"] = np.sin(2 * np.pi * frame["minute_of_day"] / 1440.0)
        frame["cos_time"] = np.cos(2 * np.pi * frame["minute_of_day"] / 1440.0)

        if "day" in frame.columns:
            frame["day"] = pd.to_numeric(frame["day"], errors="coerce").fillna(0).astype(int)
            frame["is_weekend"] = frame["day"].apply(lambda x: 1 if x >= 5 else 0)
        else:
            frame["day"] = 0
            frame["is_weekend"] = 0

        frame["is_rush_hour"] = frame["hour"].apply(lambda h: 1 if h in [7,8,9, 17,18,19] else 0)
        frame["is_night"] = frame["hour"].apply(lambda h: 1 if h < 6 or h > 22 else 0)

        if "NumberofLanes" in frame.columns:
            frame["NumberofLanes"] = pd.to_numeric(frame["NumberofLanes"], errors="coerce").fillna(0).astype(float)
        else:
            frame["NumberofLanes"] = 0.0

        if "Temperature" in frame.columns:
            frame["Temperature"] = pd.to_numeric(frame["Temperature"], errors="coerce")
        else:
            frame["Temperature"] = np.nan

        frame["road_missing"] = frame["RoadType"].isna().astype(int) if "RoadType" in frame.columns else 1
        frame["weather_missing"] = frame["Weather"].isna().astype(int) if "Weather" in frame.columns else 1
        frame["temperature_missing"] = frame["Temperature"].isna().astype(int)

        frame["LargeVehicles"] = self._map_binary(frame.get("LargeVehicles"), {"Allowed": 1, "Not Allowed": 0}, len(frame))
        frame["Landmarks"] = self._map_binary(frame.get("Landmarks"), {"Yes": 1, "No": 0}, len(frame))

        return frame

    def _map_binary(self, series: Optional[pd.Series], mapping: Dict[str, int], length: int) -> pd.Series:
        if series is None:
            return pd.Series([0] * length, dtype=int)
        mapped = series.map(mapping)
        if mapped.isna().all():
            # handle cases where values are already numeric
            mapped = pd.to_numeric(series, errors="coerce")
        return mapped.fillna(0).astype(int)

    # ------------------------------------------------------------------
    # Statistics and imputers
    # ------------------------------------------------------------------
    def fit_imputers(self, df: pd.DataFrame) -> Dict[str, Any]:
        base = self._prepare_base_frame(df)
        self.imputation_values = {
            "RoadType": _safe_mode(base["RoadType"], "Residential") if "RoadType" in base.columns else "Residential",
            "Weather": _safe_mode(base["Weather"], "Sunny") if "Weather" in base.columns else "Sunny",
            "Temperature": _safe_float(base["Temperature"].median(skipna=True), 16.0)
            if "Temperature" in base.columns
            else 16.0,
            "RoadType_per_geohash": {},
            "RoadType_per_prefix4": {},
            "Weather_per_geohash_hour": {},
            "Temperature_per_geohash_hour": {},
            "Temperature_per_geohash": {},
            "Temperature_per_hour": {},
        }

        if "RoadType" in base.columns:
            self.imputation_values["RoadType_per_geohash"] = (
                base.dropna(subset=["RoadType"])
                .groupby("geohash")["RoadType"]
                .agg(lambda s: _safe_mode(s, self.imputation_values["RoadType"]))
                .to_dict()
            )
            self.imputation_values["RoadType_per_prefix4"] = (
                base.dropna(subset=["RoadType"])
                .groupby("geohash_prefix4")["RoadType"]
                .agg(lambda s: _safe_mode(s, self.imputation_values["RoadType"]))
                .to_dict()
            )

        if "Weather" in base.columns:
            self.imputation_values["Weather_per_geohash_hour"] = (
                base.dropna(subset=["Weather"])
                .groupby(["geohash", "hour"])["Weather"]
                .agg(lambda s: _safe_mode(s, self.imputation_values["Weather"]))
                .to_dict()
            )

        if "Temperature" in base.columns:
            self.imputation_values["Temperature_per_geohash_hour"] = (
                base.groupby(["geohash", "hour"])["Temperature"].median().dropna().to_dict()
            )
            self.imputation_values["Temperature_per_geohash"] = (
                base.groupby("geohash")["Temperature"].median().dropna().to_dict()
            )
            self.imputation_values["Temperature_per_hour"] = (
                base.groupby("hour")["Temperature"].median().dropna().to_dict()
            )

        return self.imputation_values

    def _build_statistics(self, df: pd.DataFrame) -> Dict[str, Any]:
        base = self._prepare_base_frame(df)
        if "demand" not in base.columns:
            raise ValueError("Training dataframe must include the demand target column.")

        demand = pd.to_numeric(base["demand"], errors="coerce").fillna(0.0)
        self.global_target_mean = float(demand.mean()) if len(demand) else 0.0

        self.fit_imputers(base)

        stats: Dict[str, Any] = {
            "version": self.version,
            "global_target_mean": self.global_target_mean,
            "roadtype_by_geohash": self.imputation_values.get("RoadType_per_geohash", {}),
            "roadtype_by_prefix4": self.imputation_values.get("RoadType_per_prefix4", {}),
            "weather_by_geohash_hour": self.imputation_values.get("Weather_per_geohash_hour", {}),
            "temperature_by_geohash_hour": self.imputation_values.get("Temperature_per_geohash_hour", {}),
            "temperature_by_geohash": self.imputation_values.get("Temperature_per_geohash", {}),
            "temperature_by_hour": self.imputation_values.get("Temperature_per_hour", {}),
            "roadtype_global": self.imputation_values.get("RoadType", "Residential"),
            "weather_global": self.imputation_values.get("Weather", "Sunny"),
            "temperature_global": self.imputation_values.get("Temperature", 16.0),
            "geohash_mean": base.groupby("geohash")["demand"].mean().dropna().to_dict(),
            "geohash_day_mean": base.groupby(["geohash", "day"])["demand"].mean().dropna().to_dict(),
            "geohash_hour_mean": base.groupby(["geohash", "hour"])["demand"].mean().dropna().to_dict(),
            "geohash_prefix4_mean": base.groupby("geohash_prefix4")["demand"].mean().dropna().to_dict(),
            "day_mean": base.groupby("day")["demand"].mean().dropna().to_dict(),
            "day_hour_mean": base.groupby(["day", "hour"])["demand"].mean().dropna().to_dict(),
            "hour_mean": base.groupby("hour")["demand"].mean().dropna().to_dict(),
            "roadtype_mean": base.groupby("RoadType")["demand"].mean().dropna().to_dict(),
            "weather_mean": base.groupby("Weather")["demand"].mean().dropna().to_dict(),
            "lane_mean": base.groupby("NumberofLanes")["demand"].mean().dropna().to_dict(),
            "geohash_count": base["geohash"].value_counts().to_dict(),
            "geohash_prefix4_count": base["geohash_prefix4"].value_counts().to_dict(),
            "day_count": base["day"].value_counts().to_dict(),
            "hour_count": base["hour"].value_counts().to_dict(),
            "geohash_hour_count": base.groupby(["geohash", "hour"]).size().to_dict(),
            "geohash_day_count": base.groupby(["geohash", "day"]).size().to_dict(),
        }

        self.statistics = stats
        return stats

    # ------------------------------------------------------------------
    # Transform helpers
    # ------------------------------------------------------------------
    def _fill_by_map(
        self,
        frame: pd.DataFrame,
        column: str,
        primary_map: Dict[Any, Any],
        fallback: Any,
        secondary_map: Optional[Dict[Any, Any]] = None,
    ) -> pd.Series:
        values = frame[column].copy()
        mapped = pd.Series(index=frame.index, dtype=object)

        if column in frame.columns:
            mapped = values.copy()

        if secondary_map is not None and "geohash_prefix4" in frame.columns:
            missing = mapped.isna()
            mapped.loc[missing] = frame.loc[missing, "geohash_prefix4"].map(secondary_map)

        if "geohash" in frame.columns:
            missing = mapped.isna()
            mapped.loc[missing] = frame.loc[missing, "geohash"].map(primary_map)

        return mapped.fillna(fallback)

    def _apply_imputation(self, frame: pd.DataFrame, stats: Dict[str, Any]) -> pd.DataFrame:
        output = frame.copy()

        if "RoadType" in output.columns:
            road_missing = output["RoadType"].isna()
            road_fill = (
                output.loc[road_missing, "geohash"].map(stats.get("roadtype_by_geohash", {}))
                if "geohash" in output.columns
                else pd.Series(index=output.index[road_missing], dtype=object)
            )
            if "geohash_prefix4" in output.columns:
                road_fill = road_fill.fillna(output.loc[road_missing, "geohash_prefix4"].map(stats.get("roadtype_by_prefix4", {})))
            output.loc[road_missing, "RoadType"] = road_fill.fillna(stats.get("roadtype_global", "Residential"))
        else:
            output["RoadType"] = stats.get("roadtype_global", "Residential")

        if "Weather" in output.columns:
            weather_missing = output["Weather"].isna()
            weather_fill = pd.Series(index=output.index[weather_missing], dtype=object)
            if "geohash" in output.columns and "hour" in output.columns:
                weather_fill = output.loc[weather_missing].apply(
                    lambda row: stats.get("weather_by_geohash_hour", {}).get(
                        (row["geohash"], int(row["hour"])),
                        np.nan,
                    ),
                    axis=1,
                )
            output.loc[weather_missing, "Weather"] = weather_fill.fillna(stats.get("weather_global", "Sunny"))
        else:
            output["Weather"] = stats.get("weather_global", "Sunny")

        if "Temperature" in output.columns:
            temperature_missing = output["Temperature"].isna()
            if temperature_missing.any():
                geo_hour = output.loc[temperature_missing].apply(
                    lambda row: stats.get("temperature_by_geohash_hour", {}).get(
                        (row["geohash"], int(row["hour"])),
                        np.nan,
                    ),
                    axis=1,
                )
                geo = output.loc[temperature_missing, "geohash"].map(stats.get("temperature_by_geohash", {}))
                hour = output.loc[temperature_missing, "hour"].map(stats.get("temperature_by_hour", {}))
                fill_values = geo_hour.fillna(geo).fillna(hour).fillna(stats.get("temperature_global", 16.0))
                output.loc[temperature_missing, "Temperature"] = fill_values
            output["Temperature"] = output["Temperature"].fillna(stats.get("temperature_global", 16.0))
        else:
            output["Temperature"] = stats.get("temperature_global", 16.0)

        output["RoadType"] = output["RoadType"].fillna(stats.get("roadtype_global", "Residential")).astype(str)
        output["Weather"] = output["Weather"].fillna(stats.get("weather_global", "Sunny")).astype(str)

        return output

    def _add_target_features(self, frame: pd.DataFrame, stats: Dict[str, Any]) -> pd.DataFrame:
        output = frame.copy()
        global_mean = stats.get("global_target_mean", 0.0)
        
        def smooth_encode(df, col, mean_map_key, count_map_key, smoothing=15):
            mean_map = stats.get(mean_map_key, {})
            count_map = stats.get(count_map_key, {})
            val_mean = df[col].map(mean_map).fillna(global_mean)
            val_count = df[col].map(count_map).fillna(0)
            return (val_count * val_mean + smoothing * global_mean) / (val_count + smoothing)
            
        output["geohash_mean"] = smooth_encode(output, "geohash", "geohash_mean", "geohash_count", smoothing=25)
        output["day_mean"] = smooth_encode(output, "day", "day_mean", "day_count", smoothing=15)
        output["hour_mean"] = smooth_encode(output, "hour", "hour_mean", "hour_count", smoothing=15)
        output["roadtype_mean"] = output["RoadType"].map(stats.get("roadtype_mean", {})).fillna(global_mean)
        output["weather_mean"] = output["Weather"].map(stats.get("weather_mean", {})).fillna(global_mean)
        output["lane_mean"] = output["NumberofLanes"].map(stats.get("lane_mean", {})).fillna(global_mean)
        
        # Interaction Encodings (Zip-based for speed)
        def smooth_encode_interaction(df, col1, col2, mean_map_key, count_map_key, fallback_col, smoothing=10):
            mean_map = stats.get(mean_map_key, {})
            count_map = stats.get(count_map_key, {})
            
            keys = list(zip(df[col1], df[col2]))
            val_mean = pd.Series([mean_map.get(k, np.nan) for k in keys], index=df.index).fillna(df[fallback_col])
            val_count = pd.Series([count_map.get(k, 0) for k in keys], index=df.index)
            
            return (val_count * val_mean + smoothing * df[fallback_col]) / (val_count + smoothing)
            
        output["geohash_hour_mean"] = smooth_encode_interaction(output, "geohash", "hour", "geohash_hour_mean", "geohash_hour_count", "geohash_mean", smoothing=10)
        output["geohash_day_mean"] = smooth_encode_interaction(output, "geohash", "day", "geohash_day_mean", "geohash_day_count", "geohash_mean", smoothing=10)
        
        return output

    def _encode_categoricals(self, frame: pd.DataFrame) -> pd.DataFrame:
        output = frame.copy()
        output["RoadType"] = pd.Categorical(
            output["RoadType"].astype(str),
            categories=ROADTYPE_CATEGORIES,
            ordered=False,
        )
        output["Weather"] = pd.Categorical(
            output["Weather"].astype(str),
            categories=WEATHER_CATEGORIES,
            ordered=False,
        )
        output = pd.get_dummies(output, columns=["RoadType", "Weather"], prefix=["RoadType", "Weather"], dtype=float)

        expected_dummy_columns = [f"RoadType_{cat}" for cat in ROADTYPE_CATEGORIES] + [f"Weather_{cat}" for cat in WEATHER_CATEGORIES]
        for column in expected_dummy_columns:
            if column not in output.columns:
                output[column] = 0.0

        return output

    def _prepare_features(self, df: pd.DataFrame, stats: Dict[str, Any], fit: bool = False) -> Tuple[pd.DataFrame, pd.DataFrame]:
        base = self._prepare_base_frame(df)
        base = self._apply_imputation(base, stats)
        base = self._add_target_features(base, stats)
        features = self._encode_categoricals(base)

        drop_columns = [column for column in ["Index", "geohash", "timestamp", "geohash_prefix4"] if column in features.columns]
        features = features.drop(columns=drop_columns)

        if "demand" in features.columns and not fit:
            # Keep the target for downstream analytics but do not feed it to models.
            pass

        if fit:
            self.feature_columns = [column for column in features.columns if column != "demand"]
        elif self.feature_columns:
            for column in self.feature_columns:
                if column not in features.columns:
                    features[column] = 0.0
            extra = [column for column in features.columns if column not in self.feature_columns and column != "demand"]
            if extra:
                features = features.drop(columns=extra)
            ordered = self.feature_columns + (["demand"] if "demand" in features.columns else [])
            features = features[ordered]

        return features, base

    def preprocess(self, df: pd.DataFrame, is_train: bool = True) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Compatibility wrapper used by the existing codebase and tests.
        - For training data it fits statistics on the provided dataframe when needed.
        - For inference it uses the previously loaded artifact statistics.
        """
        if is_train and "demand" in df.columns and not self.statistics:
            stats = self._build_statistics(df)
        else:
            stats = self.statistics or self.imputation_values
            if not stats:
                stats = self._build_statistics(df) if "demand" in df.columns else self.imputation_values

        features, enriched = self._prepare_features(df, stats, fit=is_train)
        return features, enriched

    # ------------------------------------------------------------------
    # Model training / evaluation
    # ------------------------------------------------------------------
    def _model_candidates(self, hyperparameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        hyperparameters = hyperparameters or {}
        max_rounds = max(50, int(hyperparameters.get("max_rounds", 300) or 300))
        learning_rate = float(hyperparameters.get("learning_rate", 0.05) or 0.05)

        models: Dict[str, Any] = {
            "LinearRegression": Ridge(alpha=1.5, random_state=None),
            "RandomForest": RandomForestRegressor(
                n_estimators=100,
                max_depth=15,
                n_jobs=-1,
                random_state=42,
            ),
            "XGBoost": xgb.XGBRegressor(
                n_estimators=max_rounds,
                max_depth=8,
                learning_rate=learning_rate,
                subsample=0.8,
                objective="reg:squarederror",
                random_state=42,
                n_jobs=-1,
            ),
        }

        if LGBM_AVAILABLE:
            models["LightGBM"] = lgb.LGBMRegressor(
                n_estimators=max_rounds,
                learning_rate=learning_rate,
                num_leaves=31,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                n_jobs=-1,
                verbosity=-1,
            )

        if CATBOOST_AVAILABLE:
            models["CatBoost"] = CatBoostRegressor(
                iterations=max_rounds,
                depth=8,
                learning_rate=learning_rate,
                loss_function="RMSE",
                eval_metric="R2",
                l2_leaf_reg=4.0,
                random_seed=42,
                verbose=0,
                allow_writing_files=False,
            )

        models["ExtraTrees"] = ExtraTreesRegressor(n_estimators=max_rounds, max_depth=12, random_state=42, n_jobs=-1)
        models["HistGradientBoosting"] = HistGradientBoostingRegressor(learning_rate=learning_rate, max_iter=max_rounds, random_state=42)

        # Ensemble
        estimators = []
        if LGBM_AVAILABLE: estimators.append(("lgbm", models["LightGBM"]))
        if CATBOOST_AVAILABLE: estimators.append(("cb", models["CatBoost"]))
        estimators.append(("xgb", models["XGBoost"]))
        
        models["Ensemble_Voting"] = VotingRegressor(estimators=estimators)

        return models

    def _fit_model(self, model_name: str, model: Any, X: pd.DataFrame, y: pd.Series) -> Any:
        if model_name == "CatBoost" and CATBOOST_AVAILABLE:
            model.fit(X, y, verbose=0)
        elif model_name == "XGBoost":
            model.fit(X, y)
        else:
            model.fit(X, y)
        return model

    def _predict_model(self, model: Any, X: pd.DataFrame) -> np.ndarray:
        preds = model.predict(X)
        return np.clip(np.asarray(preds, dtype=float), 0.0, 1.0)

    def _extract_shap_importance(self, model: Any, X: pd.DataFrame, feature_names: List[str]) -> Dict[str, float]:
        if not SHAP_AVAILABLE:
            if hasattr(model, "feature_importances_"):
                importance = np.asarray(model.feature_importances_, dtype=float)
                return dict(sorted({name: float(val) for name, val in zip(feature_names, importance)}.items(), key=lambda item: item[1], reverse=True))
            return {name: 0.0 for name in feature_names}

        try:
            sample_size = min(400, len(X))
            background = X.sample(n=sample_size, random_state=42) if len(X) > sample_size else X.copy()

            if model.__class__.__name__ in {"LGBMRegressor", "XGBRegressor", "RandomForestRegressor", "CatBoostRegressor"}:
                explainer = shap.TreeExplainer(model)
                shap_values = explainer.shap_values(background)
            else:
                explainer = shap.Explainer(model.predict, background)
                shap_values = explainer(background).values

            if isinstance(shap_values, list):
                shap_values = shap_values[0]
            shap_array = np.asarray(shap_values)
            if shap_array.ndim == 1:
                shap_array = shap_array.reshape(1, -1)

            mean_abs = np.abs(shap_array).mean(axis=0)
            if mean_abs.ndim > 1:
                mean_abs = mean_abs.mean(axis=0)

            importance = {name: float(val) for name, val in zip(feature_names, mean_abs)}
            return dict(sorted(importance.items(), key=lambda item: item[1], reverse=True))
        except Exception:
            if hasattr(model, "feature_importances_"):
                importance = np.asarray(model.feature_importances_, dtype=float)
                return dict(sorted({name: float(val) for name, val in zip(feature_names, importance)}.items(), key=lambda item: item[1], reverse=True))
            return {name: 0.0 for name in feature_names}

    def train_and_evaluate(
        self,
        train_path: str,
        output_dir: str = "d:/Traffic_pridiction/backend/data/models",
        hyperparameters: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        os.makedirs(output_dir, exist_ok=True)
        hyperparameters = hyperparameters or {}
        num_folds = max(2, int(hyperparameters.get("num_folds", 5) or 5))
        df_raw = pd.read_csv(train_path)
        if "demand" not in df_raw.columns:
            raise ValueError("Training dataset must contain the demand column.")

        groups = df_raw["geohash"].astype(str).values if "geohash" in df_raw.columns else np.arange(len(df_raw))
        y_all = pd.to_numeric(df_raw["demand"], errors="coerce").fillna(0.0).values

        models = self._model_candidates(hyperparameters)
        gkf = KFold(n_splits=num_folds, shuffle=True, random_state=42)

        comparison_report: Dict[str, Any] = {}
        best_model_name = None
        best_score = -np.inf

        for model_name, model_template in models.items():
            fold_r2: List[float] = []
            fold_mae: List[float] = []
            fold_rmse: List[float] = []

            for train_idx, val_idx in gkf.split(df_raw, y_all, groups=groups):
                train_df = df_raw.iloc[train_idx].copy()
                val_df = df_raw.iloc[val_idx].copy()

                fold_stats = self._build_statistics(train_df)
                train_features, _ = self._prepare_features(train_df, fold_stats, fit=True)
                feature_columns = [column for column in train_features.columns if column != "demand"]
                val_features, _ = self._prepare_features(val_df, fold_stats, fit=False)
                val_features = val_features.reindex(columns=feature_columns + (["demand"] if "demand" in val_features.columns else []), fill_value=0.0)

                X_train = train_features[feature_columns].astype(float)
                y_train = pd.to_numeric(train_df["demand"], errors="coerce").fillna(0.0)
                X_val = val_features[feature_columns].astype(float)
                y_val = pd.to_numeric(val_df["demand"], errors="coerce").fillna(0.0)

                model = self._clone_model(model_name, model_template, hyperparameters)
                model = self._fit_model(model_name, model, X_train, y_train)
                preds = self._predict_model(model, X_val)

                fold_r2.append(float(r2_score(y_val, preds)))
                fold_mae.append(float(mean_absolute_error(y_val, preds)))
                fold_rmse.append(float(np.sqrt(mean_squared_error(y_val, preds))))

            mean_r2 = float(np.mean(fold_r2))
            mean_mae = float(np.mean(fold_mae))
            mean_rmse = float(np.mean(fold_rmse))

            comparison_report[model_name] = {
                "r2": mean_r2,
                "mae": mean_mae,
                "rmse": mean_rmse,
                "fold_r2": fold_r2,
                "fold_mae": fold_mae,
                "fold_rmse": fold_rmse,
            }

            if mean_r2 > best_score:
                best_score = mean_r2
                best_model_name = model_name

        if best_model_name is None:
            raise RuntimeError("No model could be trained successfully.")

        self.best_model_name = best_model_name
        self.statistics = self._build_statistics(df_raw)
        full_features, _ = self._prepare_features(df_raw, self.statistics, fit=True)
        self.feature_columns = [column for column in full_features.columns if column != "demand"]

        X_full = full_features[self.feature_columns].astype(float)
        y_full = pd.to_numeric(df_raw["demand"], errors="coerce").fillna(0.0)
        final_model = self._clone_model(self.best_model_name, models[self.best_model_name], hyperparameters)
        self.best_model = self._fit_model(self.best_model_name, final_model, X_full, y_full)

        pipeline_state = {
            "version": self.version,
            "best_model_name": self.best_model_name,
            "feature_columns": self.feature_columns,
            "statistics": self.statistics,
            "imputation_values": self.imputation_values,
            "global_target_mean": self.global_target_mean,
        }

        pipeline_path = os.path.join(output_dir, "traffic_pipeline.joblib")
        model_path = os.path.join(output_dir, "champion_model.joblib")
        joblib.dump(pipeline_state, pipeline_path)
        joblib.dump(self.best_model, model_path)

        shap_importance = self._extract_shap_importance(self.best_model, X_full.sample(n=min(400, len(X_full)), random_state=42), self.feature_columns)

        report_data = {
            "version": self.version,
            "best_model": self.best_model_name,
            "metrics": comparison_report,
            "shap_importance": shap_importance,
            "feature_count": len(self.feature_columns),
            "training_rows": int(len(df_raw)),
        }

        report_path = os.path.join(output_dir, "model_comparison_report.json")
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=4)

        return report_data

    def _clone_model(self, model_name: str, model_template: Any, hyperparameters: Optional[Dict[str, Any]] = None) -> Any:
        hyperparameters = hyperparameters or {}
        max_rounds = max(50, int(hyperparameters.get("max_rounds", 150) or 150))
        learning_rate = float(hyperparameters.get("learning_rate", 0.08) or 0.08)

        if model_name == "LinearRegression":
            return Ridge(alpha=1.5)
        if model_name == "RandomForest":
            return RandomForestRegressor(
                n_estimators=50,
                max_depth=12,
                n_jobs=-1,
                random_state=42,
            )
        if model_name == "XGBoost":
            return xgb.XGBRegressor(
                n_estimators=max_rounds,
                max_depth=6,
                learning_rate=learning_rate,
                subsample=0.8,
                objective="reg:squarederror",
                random_state=42,
                n_jobs=-1,
            )
        if model_name == "LightGBM" and LGBM_AVAILABLE:
            return lgb.LGBMRegressor(
                n_estimators=max_rounds,
                learning_rate=learning_rate,
                num_leaves=31,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                n_jobs=-1,
                verbosity=-1,
            )
        if model_name == "CatBoost" and CATBOOST_AVAILABLE:
            return CatBoostRegressor(
                iterations=max_rounds,
                depth=8,
                learning_rate=learning_rate,
                loss_function="RMSE",
                eval_metric="R2",
                l2_leaf_reg=4.0,
                random_seed=42,
                verbose=0,
                allow_writing_files=False,
            )
        return model_template

    # ------------------------------------------------------------------
    # Artifact loading and inference
    # ------------------------------------------------------------------
    def load_pipeline(self, model_dir: str = "d:/Traffic_pridiction/backend/data/models"):
        pipeline_path = os.path.join(model_dir, "traffic_pipeline.joblib")
        model_path = os.path.join(model_dir, "champion_model.joblib")

        if not os.path.exists(pipeline_path) or not os.path.exists(model_path):
            raise FileNotFoundError("Model files do not exist. Please run training first.")

        pipeline_state = joblib.load(pipeline_path)
        self.best_model = joblib.load(model_path)

        if "feature_columns" in pipeline_state:
            self.feature_columns = pipeline_state.get("feature_columns", [])
        else:
            self.feature_columns = pipeline_state.get("feature_cols", [])

        self.best_model_name = pipeline_state.get("best_model_name")
        self.statistics = pipeline_state.get("statistics", {})
        self.imputation_values = pipeline_state.get("imputation_values", {})
        self.global_target_mean = float(pipeline_state.get("global_target_mean", self.statistics.get("global_target_mean", 0.0)))

        if not self.statistics and self.imputation_values:
            self.statistics = {
                "version": self.version,
                "global_target_mean": self.global_target_mean,
                "roadtype_global": self.imputation_values.get("RoadType", "Residential"),
                "weather_global": self.imputation_values.get("Weather", "Sunny"),
                "temperature_global": self.imputation_values.get("Temperature", 16.0),
            }

    def predict_test(self, test_path: str, model_dir: str = "d:/Traffic_pridiction/backend/data/models") -> pd.DataFrame:
        if self.best_model is None:
            self.load_pipeline(model_dir)

        df_test = pd.read_csv(test_path)
        features, _ = self._prepare_features(df_test, self.statistics, fit=False)
        feature_matrix = features.reindex(columns=self.feature_columns, fill_value=0.0).astype(float)

        preds = self._predict_model(self.best_model, feature_matrix)
        index_col = df_test["Index"] if "Index" in df_test.columns else pd.Series(range(len(df_test)))
        submission = pd.DataFrame({
            "Index": index_col,
            "demand": preds,
        })
        return submission

    def predict_interactive(self, input_data: Dict[str, Any], model_dir: str = "d:/Traffic_pridiction/backend/data/models") -> float:
        if self.best_model is None:
            self.load_pipeline(model_dir)

        record = {
            "Index": input_data.get("Index", 0),
            "geohash": input_data.get("geohash") or input_data.get("Geohash") or "qp02z1",
            "day": int(input_data.get("day", 49)),
            "timestamp": input_data.get("timestamp", "0:0"),
            "RoadType": input_data.get("road_type") or input_data.get("RoadType") or "Residential",
            "NumberofLanes": _safe_float(input_data.get("num_lanes", 1), 1.0),
            "LargeVehicles": input_data.get("large_vehicles") or input_data.get("LargeVehicles") or "Not Allowed",
            "Landmarks": input_data.get("landmarks") or input_data.get("Landmarks") or "No",
            "Temperature": _safe_float(input_data.get("temperature", self.imputation_values.get("Temperature", 16.0)), self.imputation_values.get("Temperature", 16.0)),
            "Weather": input_data.get("weather") or input_data.get("Weather") or "Sunny",
        }

        df = pd.DataFrame([record])
        features, _ = self._prepare_features(df, self.statistics, fit=False)
        feature_matrix = features.reindex(columns=self.feature_columns, fill_value=0.0).astype(float)
        pred = float(self._predict_model(self.best_model, feature_matrix)[0])
        return pred
