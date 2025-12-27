import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import numpy as np

# Generate sample trade data (replace with real data)
print("📊 Loading trade data...")

data = {
    'volume': np.random.randint(100000, 5000000, 1000),
    'vwapDiff': np.random.uniform(-5, 5, 1000),
    'rsi': np.random.uniform(0, 100, 1000),
    'trendStrength': np.random.uniform(0, 1, 1000),
    'win': np.random.choice([0, 1], 1000)
}

df = pd.DataFrame(data)

print(f"✅ Loaded {len(df)} trades")

# Split features and target
X = df[["volume", "vwapDiff", "rsi", "trendStrength"]]
y = df["win"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"✅ Split: {len(X_train)} train, {len(X_test)} test")

# Train XGBoost model
print("🚀 Training XGBoost model...")

model = xgb.XGBClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective='binary:logistic',
    eval_metric='error',
    use_label_encoder=False,
    random_state=42
)

model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=False
)

# Evaluate model
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"✅ Model Accuracy: {accuracy * 100:.2f}%")

# Feature importance
importance = model.feature_importances_

print("📊 Feature Importance:")
for feature, score in zip(X.columns, importance):
    print(f"  - {feature}: {score:.4f}")

# Save model
model.save_model("xgboost_model.json")
print("💾 Model saved to xgboost_model.json")

# Save feature importance
import json
with open("feature_importance.json", "w") as f:
    json.dump({
        'features': list(X.columns),
        'importance': importance.tolist()
    }, f)

print("✅ Feature importance saved to feature_importance.json")
print("🎉 XGBoost training completed!")
