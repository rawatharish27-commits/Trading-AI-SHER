import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

export async function redisRateLimit(
  key: string,
  limit: number,
  windowSec: number
) {
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, windowSec);
  }

  if (current > limit) {
    throw new Error("Rate limit exceeded");
  }
}
