import pandas as pd
import numpy as np

file_path = 'd:/Traffic_pridiction/e88186124ec611f1/dataset/jan to may police violation_anonymized791b166.csv'
print(f"Loading dataset: {file_path}")
df = pd.read_csv(file_path)

print(f"\nShape of dataset: {df.shape}")
print("\nColumns and Data Types:")
print(df.dtypes)

print("\nNull Values Count:")
print(df.isnull().sum())

print("\nDate Ranges:")
if 'created_datetime' in df.columns:
    df['created_datetime'] = pd.to_datetime(df['created_datetime'], errors='coerce')
    print(f"Created datetime range: {df['created_datetime'].min()} to {df['created_datetime'].max()}")
if 'closed_datetime' in df.columns:
    df['closed_datetime'] = pd.to_datetime(df['closed_datetime'], errors='coerce')
    print(f"Closed datetime range: {df['closed_datetime'].min()} to {df['closed_datetime'].max()}")

print("\nUnique Violation Types:")
print(df['violation_type'].value_counts(dropna=False).head(20))

print("\nUnique Vehicle Types:")
print(df['vehicle_type'].value_counts(dropna=False).head(10))

print("\nValidation Status Counts:")
print(df['validation_status'].value_counts(dropna=False))

print("\nTop 10 Locations:")
print(df['location'].value_counts(dropna=False).head(10))

print("\nTop 10 Police Stations:")
print(df['police_station'].value_counts(dropna=False).head(10))

print("\nTop 10 Junctions:")
print(df['junction_name'].value_counts(dropna=False).head(10))

print("\nSample coordinates:")
print(df[['latitude', 'longitude']].describe())
