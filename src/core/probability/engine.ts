import { WEIGHTS } from "./weights";

export function computeProbability(data: any) {
  let score = 0;
  let evidence: string[] = [];

  if (data.volumeSpike) {
    score += WEIGHTS.volume;
    evidence.push("Volume Spike");
  }

  if (data.aboveVWAP) {
    score += WEIGHTS.vwap;
    evidence.push("Above VWAP");
  }

  if (data.trend === "UP") {
    score += WEIGHTS.trend;
    evidence.push("Uptrend");
  }

  const probability = Math.min(100, Math.round(score * 100));

  return {
    probability,
    confidence: probability > 70 ? "HIGH" : probability > 50 ? "MEDIUM" : "LOW",
    evidenceCount: evidence.length,
    evidenceList: evidence,
    riskLabel: probability > 70 ? "LOW" : "MEDIUM",
    marketRegime: data.regime
  };
}
