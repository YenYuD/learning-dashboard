import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 只在有設定 Upstash 時初始化，避免 import 時崩潰
function createRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const redis = createRedis();

// 登入：每 IP 每分鐘 20 次（寬鬆，考慮 NAT）
export const loginIpLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      prefix: "login:ip",
    })
  : null;

// 註冊：每 IP 每分鐘 5 次
export const registerLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      prefix: "register:ip",
    })
  : null;

export function getClientIp(request: Request): string {
  // GCP Load Balancer 設置的真實 IP 在第一個位置
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "127.0.0.1";
}
