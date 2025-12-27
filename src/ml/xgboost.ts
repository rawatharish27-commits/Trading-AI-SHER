export function xgBoostPredict(features: number[]) {
  // pretrained weights (example)
  const weights = [0.3, 0.2, 0.25, 0.25];

  return features.reduce(
    (sum, f, i) => sum + f * weights[i],
    0
  );
}
