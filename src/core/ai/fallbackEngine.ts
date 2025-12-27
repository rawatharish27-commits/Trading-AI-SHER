import { computeProbability } from "@/core/probability/engine";

export async function runFallback(input: any) {
  return computeProbability(input.marketData);
}
