import { describe, it, expect, vi, afterEach } from 'vitest';
import app from '../src/index.js';

describe('Contact API & Endpoints', () => {
  const env = {
    TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
    RESEND_API_KEY: 're_test_key',
    RESEND_FROM: 'test@example.com',
    ADMIN_EMAIL: 'admin@example.com',
    ALLOWED_ORIGIN: 'http://localhost:5173',
  };

  const validData = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    subject: 'Inquiry',
    message: 'Hello, this is a test message that is long enough.',
    turnstileToken: 'test-token',
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 for invalid JSON body', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5173',
        },
        body: 'invalid-json',
      }),
      env
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({
      success: false,
      error: 'Invalid JSON body.',
    });
  });

  it('returns 400 for missing required fields', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5173',
        },
        body: JSON.stringify({}),
      }),
      env
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Validation failed.');
    expect(data.details).toBeInstanceOf(Array);
    expect(data.details.length).toBeGreaterThan(0);
  });

  it('returns 400 for invalid email', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5173',
        },
        body: JSON.stringify({
          ...validData,
          email: 'invalid-email-address',
        }),
      }),
      env
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Validation failed.');
    expect(data.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'email',
          message: 'Please provide a valid email address.',
        }),
      ])
    );
  });

  it('returns 400 for missing turnstile token', async () => {
    const { turnstileToken, ...dataWithoutToken } = validData;
    const res = await app.fetch(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5173',
        },
        body: JSON.stringify(dataWithoutToken),
      }),
      env
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Validation failed.');
    expect(data.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'turnstileToken',
          message: 'Bot verification token is required.',
        }),
      ])
    );
  });

  it('returns 403 when Turnstile verification fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url) => {
        if (typeof url === 'string' && url.includes('challenges.cloudflare.com')) {
          return new Response(
            JSON.stringify({
              success: false,
              'error-codes': ['invalid-input-response'],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('Not Found', { status: 404 });
      })
    );

    const res = await app.fetch(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5173',
        },
        body: JSON.stringify(validData),
      }),
      env
    );

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data).toEqual({
      success: false,
      error: 'Invalid verification token.',
    });
  });

  it('returns 403 for expired/duplicate Turnstile token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url) => {
        if (typeof url === 'string' && url.includes('challenges.cloudflare.com')) {
          return new Response(
            JSON.stringify({
              success: false,
              'error-codes': ['timeout-or-duplicate'],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('Not Found', { status: 404 });
      })
    );

    const res = await app.fetch(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5173',
        },
        body: JSON.stringify(validData),
      }),
      env
    );

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data).toEqual({
      success: false,
      error: 'Verification expired or already used. Please try again.',
    });
  });

  it('returns 500 when Resend API fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url) => {
        if (typeof url === 'string' && url.includes('challenges.cloudflare.com')) {
          return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (typeof url === 'string' && url.includes('api.resend.com')) {
          return new Response(
            JSON.stringify({ message: 'Internal Server Error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('Not Found', { status: 404 });
      })
    );

    const res = await app.fetch(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5173',
        },
        body: JSON.stringify(validData),
      }),
      env
    );

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data).toEqual({
      success: false,
      error: 'Failed to process your submission. Please try again later.',
    });
  });

  it('returns 200 for valid submission', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url) => {
        if (typeof url === 'string' && url.includes('challenges.cloudflare.com')) {
          return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (typeof url === 'string' && url.includes('api.resend.com')) {
          return new Response(
            JSON.stringify({ id: 'test-id' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('Not Found', { status: 404 });
      })
    );

    const res = await app.fetch(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5173',
        },
        body: JSON.stringify(validData),
      }),
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      success: true,
      message: 'Thank you for reaching out! We will get back to you soon.',
    });
  });

  it('returns 200 from health endpoint', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/health', {
        method: 'GET',
      }),
      env
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
  });

  it('returns 404 for unknown routes', async () => {
    const res = await app.fetch(
      new Request('http://localhost/api/unknown-route', {
        method: 'GET',
      }),
      env
    );

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toEqual({
      success: false,
      error: 'Not found',
    });
  });
});
