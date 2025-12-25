
# 🦁 SHER.AI | Sovereign User Tutorial (v4.5)

Welcome to the **SHER.AI Sovereign Node**. This guide is your tactical manual for managing capital with institutional-grade discipline.

---

## 📡 1. Signal Discovery: The Audit Flow

When a signal appears, it is no longer just an alert. It is a **Decision Node**.

1.  **Check Conviction**: Signals above **75%** are high-conviction. **90%+** are Institutional Grade.
2.  **Open Thesis**: Click any signal to open the **Thesis Drawer**.
    -   **Supporting Factors**: Verify if Momentum and Orderflow are aligned.
    -   **Invalidation Level**: The "Line in the Sand." If price hits this, the AI logic has failed.
3.  **Conflict Warning**: If "Evidence Conflict" is detected, the system slashes the probability automatically.

## 🧪 2. Shadow Shard Lab: Safe Innovation

Experimental strategies live here until they prove their worth.

-   **Incubation**: New strategies run in "Shadow Mode" (Live data, zero execution).
-   **Reputation**: A strategy needs **30 trades** and a **65% win rate** to build a "Reputation."
-   **Promotion**: Only "Elite Tier" users can promote a Shadow Shard to Live Execution.

## 🛡️ 3. Managing the Risk Firewall

-   **Regime Indicator**: Look at the status bar.
    -   `TRENDING`: Momentum shards active.
    -   `CHOPPY`: Mean reversion logic enforced.
    -   `PANIC`: High-frequency execution throttled for safety.
-   **Nuclear Halt**: The red button cancels all pending orders and stops all automated logic across linked sub-accounts.

## 🛠️ 4. Cloud Run Deployment (Developer Tutorial)

If your container fails to start, check the **Sher Deployment Checklist**:

1.  **PORT Check**: Ensure `package.json` uses `next start -p 8080`.
2.  **Host Check**: Ensure `next start -H 0.0.0.0` is used (Next.js default is often localhost).
3.  **YAML Alignment**: Verify `cloud-run.yaml` has `containerPort: 8080`.
4.  **Build Verification**:
    ```bash
    # Test locally before pushing
    docker build -t sher-test .
    docker run -p 8080:8080 sher-test
    # Open http://localhost:8080 - if it loads, Cloud Run will accept it.
    ```

---
*Institutional Support: help@sher.ai | Shard v4.5*
