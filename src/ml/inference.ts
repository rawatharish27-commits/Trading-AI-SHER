import { xgBoostPredict } from "./xgboost";
import { calibrateProbability } from "./calibrator";

export function mlInfer(features: number[]) {
  const raw = xgBoostPredict(features);
  return calibrateProbability(raw, 75);
}
