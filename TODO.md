# TODO for PHASE 3 Implementation

- [x] Edit prisma/schema.prisma to align with provided schema, add Strategy model and relations
- [x] Edit app/api/health/route.ts to add prisma.user.findFirst() check and update response
- [x] Run npx prisma generate
- [x] Run npx prisma db push
- [x] Test /api/health endpoint

# PHASE 4 — MARKET SESSION + FAKE TICK FIREWALL

- [x] Verify lib/market/sessionEngine.ts, dataModeResolver.ts, tickFirewall.ts implemented
- [x] Verify hooks/useMarketStream.ts integrates firewall and session engine
- [x] Verify components/MarketStatusBadge.tsx uses DataModeResolver for UI badge
- [x] Verify data/nse-holidays.json present
- [x] Test UI badge and tick behavior during market open/closed

# PHASE 5 — ANGEL ONE LIVE READINESS (EXECUTION MODE)

- [x] Add EXECUTION_ENABLED kill-switch in executionService.ts
- [x] Add session validation methods in angelOneAdapter.ts (validateProfile, validateFunds, validateOrderBook)
- [x] Add isRealAngelTick function in tickFirewall.ts
- [x] Verify reconciliationService.ts for order reconciliation pipeline
- [x] Create liveModeChecklist.ts for enable checklist
- [x] Test execution guard with EXECUTION_ENABLED=false
- [x] Test session validation methods
- [x] Test tick firewall with real Angel tick format
- [x] Verify reconciliation runs
- [x] Run checklist before enabling live mode

# PHASE 6 — CLOUD RUN PRODUCTION HARDENING

- [x] Add health & liveness checks in app/api/health/route.ts (market, broker status)
- [x] Set PORT=8080 and EXECUTION_ENABLED=false in Dockerfile
- [x] Set Cloud Run resource settings (CPU 1, Memory 1GiB, Min instances 1, Max 5, Timeout 300s, Concurrency 80)
- [x] Add logging for market open/close, data mode switch, tick rejected count, order placed/failed, DB write error
- [x] Add fail-safe behavior: auto-switch to PAPER mode on failure
- [x] Test health endpoint with market and broker status
- [x] Verify logging in console
- [x] Test fail-safe behavior
