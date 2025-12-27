import numpy as np
import json

# Load feature importance (simulated)
print("📊 Loading feature importance...")

with open("feature_importance.json", "r") as f:
    data = json.load(f)

weights = np.array(data['importance'])

print(f"✅ Loaded weights: {weights}")

# Create model weights JSON
model_weights = {
    'volume_weight': float(weights[0]),
    'vwapDiff_weight': float(weights[1]),
    'rsi_weight': float(weights[2]),
    'trendStrength_weight': float(weights[3])
}

# Save weights
with open("model_weights.json", "w") as f:
    json.dump(model_weights, f, indent=2)

print("📁 Exported model weights to model_weights.json")
print("🎉 Export complete!")
