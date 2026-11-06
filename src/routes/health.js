import { Hono } from 'hono';

const healthRoutes = new Hono();

healthRoutes.get('/health', (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export { healthRoutes };
