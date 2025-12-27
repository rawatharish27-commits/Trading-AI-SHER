export function extractFeatures(candle: any) {
  return [
    candle.volume,
    candle.vwapDiff,
    candle.rsi,
    candle.trendStrength
  ];
}
