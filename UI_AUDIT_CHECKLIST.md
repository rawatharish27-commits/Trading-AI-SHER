
# 🏛️ SHER.AI Institutional UI Audit Checklist

Follow this protocol before every production demo or release to ensure compliance with the **Institutional Visual Standard (IVS)**.

---

## 🎨 1. VISUAL GOVERNANCE
- [ ] **Muted Palette**: Are you using the official Surface Dark (`#161B22`) and Background Dark (`#0E1117`)?
- [ ] **Semantic Risk Colors**: 
  - Green (`#2F855A`) used ONLY for "PASS/SAFE".
  - Amber (`#B7791F`) used ONLY for "CAUTION/THROTTLE".
  - Red (`#9B2C2C`) used ONLY for "HALT/BLOCK".
- [ ] **Sharp Corners**: All containers must use `rounded-inst` (2px). Zero retail "bubble" UI allowed.
- [ ] **No Flashing Indicators**: All status pulses must be slow (`duration-2000`) and subtle.

## 🧮 2. DATA FIDELITY
- [ ] **Tabular Nums**: All currency, percentages, and latency stats must use `font-mono` or `tabular-nums`.
- [ ] **No Decimal Overload**: Financial metrics capped at 2 decimal places. Probability capped at 0.
- [ ] **Labeling Hierarchy**: Every large value must have a tiny uppercase label (`tracking-[0.3em]`) explaining the context.

## 🧠 3. AI EXPLAINABILITY
- [ ] **Veto Transparency**: Is the "Why we didn't trade" view (No-Trade) as visually detailed as the Trade view?
- [ ] **Guard Trace**: Does every decision show the step-by-step gate verification (Regime -> Horizon -> Liquidity)?
- [ ] **Model Identity**: Is the model version (e.g., `v4.2.1-stable`) visible on the dashboard?

## 🛡️ 4. RISK VISIBILITY
- [ ] **Risk Over Profit**: Is the Session Drawdown or VaR shown *before* or *next to* the Net PnL?
- [ ] **Kill Switch Access**: Is the emergency stop accessible to Admin users without scrolling?
- [ ] **Sandbox Watermark**: If in Simulation mode, is the background watermark clearly visible?

## ⚖️ 5. COMPLIANCE LANGUAGE
- [ ] **No Retail Slang**: Replace "Buy/Sell" with "Decision", "Hot" with "High-Conviction", and "Profit" with "Alpha".
- [ ] **Inline Disclaimers**: Are mandatory SEBI/Regulatory disclaimers visible in execution panels?

---
*Institutional Fidelity Verified. Node Stable.*
