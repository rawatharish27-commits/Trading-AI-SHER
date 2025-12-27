export function buildPrompt(input: any) {
  return `
You are an institutional-grade trading analysis AI.

Market Data:
${JSON.stringify(input.marketData)}

Rules:
- No BUY/SELL words
- Output pure JSON
- Probability must be explainable

Output JSON format:
{
  "probability": number,
  "confidence": "LOW" | "MEDIUM" | "HIGH",
  "evidenceCount": number,
  "evidenceList": string[],
  "riskLabel": "LOW" | "MEDIUM" | "HIGH",
  "marketRegime": "TREND" | "RANGE" | "VOLATILE"
}
`;
}
