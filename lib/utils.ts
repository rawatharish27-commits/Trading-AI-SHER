
/**
 * 🦁 INSTITUTIONAL RETRY ENGINE
 * Part B: Hardened backoff strategy.
 */
export async function retry<T>(
  fn: () => Promise<T>, 
  retries = 2, 
  baseDelay = 1000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (i < retries - 1) {
        // Runbook Step 5: Linear/Exponential Backoff
        const delay = baseDelay * (i + 1);
        console.warn(`[RetryEngine] Attempt ${i + 1} failed. Backing off for ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Formats values to Institutional INR Standards.
 */
export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
