import os
import sys
import pandas as pd

# Add app to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from backend.app.ml.pipeline import TrafficMLPipeline

def main():
    train_path = 'd:/Traffic_pridiction/e88186124ec611f1/dataset/train.csv'
    test_path = 'd:/Traffic_pridiction/e88186124ec611f1/dataset/test.csv'
    output_dir = 'd:/Traffic_pridiction/backend/data/models'
    
    print("=== TRAFFIC DEMAND PREDICTION ML WORKFLOW ===")
    pipeline = TrafficMLPipeline()
    
    # Train and evaluate models
    print("\n1. Running training and cross-validation pipeline...")
    report = pipeline.train_and_evaluate(train_path, output_dir)
    print("\nTraining completed successfully!")
    
    # Print metrics
    print("\nModel Leaderboard:")
    for model_name, metrics in report['metrics'].items():
        print(f" - {model_name}: R2 = {metrics['r2']:.4f}, MAE = {metrics['mae']:.4f}, RMSE = {metrics['rmse']:.4f}")
        
    # Generate test predictions
    print("\n2. Scoring test set...")
    predictions = pipeline.predict_test(test_path, output_dir)
    
    # Save predictions
    predictions_dir = 'd:/Traffic_pridiction/backend/data/predictions'
    os.makedirs(predictions_dir, exist_ok=True)
    predictions_path = os.path.join(predictions_dir, "submission.csv")
    predictions.to_csv(predictions_path, index=False)
    print(f"Predictions successfully written to {predictions_path}")
    
    # Write a duplicate to the dataset folder for easy access
    dataset_predictions_path = 'd:/Traffic_pridiction/e88186124ec611f1/dataset/predictions.csv'
    predictions.to_csv(dataset_predictions_path, index=False)
    print(f"Predictions also copied to {dataset_predictions_path}")
    
if __name__ == '__main__':
    main()
