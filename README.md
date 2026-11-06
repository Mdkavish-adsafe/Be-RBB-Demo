# Rising Beyond Borders – Contact Form Backend API

Serverless contact form processing API built with **Hono on Cloudflare Workers**, featuring:
- **Cloudflare Turnstile** server-side token verification (`/siteverify`)
- **Zod** strict schema validation for form submissions
- **Resend** transactional email notifications to `kavish@risingbeyondborders.org`
- **Rate limiting** & security headers (CORS, HSTS, XSS protections)
- Comprehensive test suite with **Vitest**

---

## API Endpoints

- `GET /api/health` - Health check & server status
- `POST /api/contact` - Validate submission, verify Turnstile challenge, and trigger email notification

---

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.dev.vars.example` to `.dev.vars`:
```bash
cp .dev.vars.example .dev.vars
```

Variables:
- `TURNSTILE_SECRET_KEY`: Testing key `1x0000000000000000000000000000000AA` (always-passes for local dev)
- `RESEND_API_KEY`: Resend API key (or placeholder `re_your_resend_api_key_here` for local mock delivery)
- `RESEND_FROM`: Sender email (e.g., `onboarding@resend.dev`)
- `ADMIN_EMAIL`: Notification recipient (`kavish@risingbeyondborders.org`)
- `ALLOWED_ORIGIN`: Frontend origin (`http://localhost:5173`)

### 3. Run Development Server
```bash
npm run dev
```
Starts local Cloudflare Worker on [http://127.0.0.1:8787](http://127.0.0.1:8787).

### 4. Run Test Suite
```bash
npm test
```

---

## Deployment (Cloudflare Workers)

1. Authenticate with Cloudflare:
   ```bash
   npx wrangler login
   ```

2. Configure production secrets:
   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put RESEND_FROM
   npx wrangler secret put ADMIN_EMAIL
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

