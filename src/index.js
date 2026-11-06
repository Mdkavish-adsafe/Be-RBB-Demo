import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { contactRoutes } from './routes/contact.js';
import { healthRoutes } from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

const app = new Hono();

// Global middleware
app.use('*', secureHeaders());

// CORS — configured per-request from env (supports single origin, comma-separated list, or wildcard)
app.use('/api/*', async (c, next) => {
  const rawOrigin = c.env.ALLOWED_ORIGIN || 'http://localhost:5173';
  const origin = rawOrigin.includes(',')
    ? rawOrigin.split(',').map((o) => o.trim()).filter(Boolean)
    : rawOrigin.trim();

  const corsMiddleware = cors({
    origin,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400,
  });
  return corsMiddleware(c, next);
});

// Rate limiter for contact endpoint
app.use('/api/contact', rateLimiter);

// Error handler
app.onError(errorHandler);

// Routes
app.route('/api', healthRoutes);
app.route('/api', contactRoutes);

// 404 fallback
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

export default app;
