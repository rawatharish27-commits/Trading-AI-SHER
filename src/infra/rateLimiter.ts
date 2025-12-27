const calls = new Map<string, number>();

export async function rateLimit(userId: string) {
  const now = Date.now();
  const count = calls.get(userId) || 0;

  if (count >= 5) throw new Error("Rate limit exceeded");

  calls.set(userId, count + 1);
  setTimeout(() => calls.set(userId, 0), 60000);
}
