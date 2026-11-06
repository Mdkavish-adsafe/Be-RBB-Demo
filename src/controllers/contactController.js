import { validateContactForm } from '../validators/contactSchema.js';
import { verifyTurnstileToken } from '../services/turnstileService.js';
import { sendAdminNotification } from '../services/emailService.js';

export async function contactController(c) {
  // 1. Parse body
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Invalid JSON body.' }, 400);
  }

  // 2. Validate fields
  const validation = validateContactForm(body);
  if (!validation.success) {
    return c.json({
      success: false,
      error: 'Validation failed.',
      details: validation.errors,
    }, 400);
  }

  const { name, email, subject, message, turnstileToken } = validation.data;

  // 3. Verify Turnstile
  const turnstileResult = await verifyTurnstileToken(turnstileToken, c.env);
  if (!turnstileResult.success) {
    return c.json({
      success: false,
      error: turnstileResult.error || 'Bot verification failed.',
    }, 403);
  }

  // 4. Send email
  const emailResult = await sendAdminNotification(
    { name, email, subject, message },
    c.env
  );

  if (!emailResult.success) {
    console.error('Email sending failed');
    return c.json({
      success: false,
      error: 'Failed to process your submission. Please try again later.',
    }, 500);
  }

  // 5. Success
  return c.json({
    success: true,
    message: 'Thank you for reaching out! We will get back to you soon.',
  }, 200);
}
