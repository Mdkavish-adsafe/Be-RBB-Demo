// Simple in-memory rate limiter per Worker isolate.
// Note: Cloudflare Workers are stateless — each isolate has its own memory.
// This provides basic per-isolate protection. For robust production rate limiting,
// use Cloudflare Rate Limiting Rules via the dashboard or WAF.
const REQUEST_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

const ipRequestMap = new Map();

// Periodically clean up old entries to prevent memory leaks
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [ip, data] of ipRequestMap.entries()) {
    if (now - data.windowStart > REQUEST_WINDOW_MS * 2) {
      ipRequestMap.delete(ip);
    }
  }
}

export async function rateLimiter(c, next) {
  // Only rate limit POST requests
  if (c.req.method !== 'POST') {
    return next();
  }

  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  const now = Date.now();

  cleanup();

  let record = ipRequestMap.get(ip);

  if (!record || now - record.windowStart > REQUEST_WINDOW_MS) {
    record = { windowStart: now, count: 1 };
    ipRequestMap.set(ip, record);
    return next();
  }

  record.count++;

  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return c.json(
      {
        success: false,
        error: 'Too many requests. Please wait a moment and try again.',
      },
      429
    );
  }

  return next();
}
