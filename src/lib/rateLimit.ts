import { supabaseAdmin } from './supabase-admin';

// In-memory fallback rate limiting map for local environments or DB failure
interface RateStore {
  count: number;
  expiresAt: number;
}
const memoryStore = new Map<string, RateStore>();

export interface RateLimitConfig {
  minute: number;
  hour: number;
  day: number;
}

function checkMemoryLimit(
  id: string,
  minKey: string,
  hrKey: string,
  dayKey: string,
  limits: RateLimitConfig
): boolean {
  const now = Date.now();
  
  const getOrIncrement = (key: string, ttlMs: number): number => {
    let entry = memoryStore.get(key);
    if (!entry || entry.expiresAt < now) {
      entry = { count: 0, expiresAt: now + ttlMs };
    }
    entry.count++;
    memoryStore.set(key, entry);
    return entry.count;
  };

  const minCount = getOrIncrement(minKey, 60000);
  const hrCount = getOrIncrement(hrKey, 3600000);
  const dayCount = getOrIncrement(dayKey, 86400000);

  // Clean up memoryStore periodically to prevent memory leaks
  if (memoryStore.size > 10000) {
    for (const [k, v] of memoryStore.entries()) {
      if (v.expiresAt < now) {
        memoryStore.delete(k);
      }
    }
  }

  return minCount <= limits.minute && hrCount <= limits.hour && dayCount <= limits.day;
}

export async function checkRateLimit(
  namespace: string,
  id: string,
  limits: RateLimitConfig
): Promise<boolean> {
  const now = Date.now();
  const minWindow = Math.floor(now / 60000);
  const hrWindow = Math.floor(now / 3600000);
  const dayWindow = Math.floor(now / 86400000);

  const minKey = `${namespace}:rate:${id}:min:${minWindow}`;
  const hrKey = `${namespace}:rate:${id}:hr:${hrWindow}`;
  const dayKey = `${namespace}:rate:${id}:day:${dayWindow}`;

  // 1. Try Upstash Redis
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const response = await fetch(`${redisUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([
          ['INCR', minKey],
          ['EXPIRE', minKey, 60],
          ['INCR', hrKey],
          ['EXPIRE', hrKey, 3600],
          ['INCR', dayKey],
          ['EXPIRE', dayKey, 86400]
        ]),
        signal: AbortSignal.timeout(2000)
      });
      
      if (response.ok) {
        const results = await response.json();
        const minCount = results[0]?.result || 0;
        const hrCount = results[2]?.result || 0;
        const dayCount = results[4]?.result || 0;

        return minCount <= limits.minute && hrCount <= limits.hour && dayCount <= limits.day;
      }
    } catch (e) {
      console.warn(`[Rate Limit - ${namespace}] Upstash Redis check failed, falling back to database:`, e);
    }
  }

  // 2. Fallback to Supabase Database Rate Limiting
  try {
    const minDate = new Date(minWindow * 60000).toISOString();
    const hrDate = new Date(hrWindow * 3600000).toISOString();
    const dayDate = new Date(dayWindow * 86400000).toISOString();

    const dbIncrement = async (key: string, windowStart: string, windowType: string, limit: number) => {
      const { data, error } = await supabaseAdmin.rpc('increment_telemetry_rate_limit', {
        p_key: key,
        p_window_start: windowStart,
        p_window_type: windowType
      });
      if (error) throw error;
      return (data as number) <= limit;
    };

    const [minOk, hrOk, dayOk] = await Promise.all([
      dbIncrement(`${namespace}:rate:${id}`, minDate, 'minute', limits.minute),
      dbIncrement(`${namespace}:rate:${id}`, hrDate, 'hour', limits.hour),
      dbIncrement(`${namespace}:rate:${id}`, dayDate, 'day', limits.day)
    ]);

    return minOk && hrOk && dayOk;
  } catch (dbErr) {
    console.warn(`[Rate Limit - ${namespace}] Supabase Database rate-limiting failed, falling back to memoryStore:`, dbErr);
  }

  // 3. Fallback to in-memory limits
  return checkMemoryLimit(id, minKey, hrKey, dayKey, limits);
}
