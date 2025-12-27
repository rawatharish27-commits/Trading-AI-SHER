#!/bin/bash

echo "🚀 Starting ML Retraining Pipeline..."

# Step 1: Train XGBoost
echo "📊 Step 1: Training XGBoost model..."
python train_xgboost.py

# Check if training succeeded
if [ $? -eq 0 ]; then
  echo "✅ XGBoost training completed"
else
  echo "❌ XGBoost training failed"
  exit 1
fi

# Step 2: Export model weights
echo "📦 Step 2: Exporting model weights..."
python export_model.py

# Check if export succeeded
if [ $? -eq 0 ]; then
  echo "✅ Model weights exported successfully"
else
  echo "❌ Model export failed"
  exit 1
fi

# Step 3: Update app (simulate hot-reload)
echo "🔄 Step 3: Updating app model weights..."
echo "Model weights ready for app reload"

echo "🎉 ML Retraining Pipeline Complete!"
echo "📊 Model: XGBoost"
echo "📁 Weights: model_weights.json"
echo "🔄 App reload: Ready"
