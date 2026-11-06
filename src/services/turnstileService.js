const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstileToken(token, env) {
  if (!token) {
    return { success: false, error: 'Missing verification token.' };
  }

  const secretKey = env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY is not configured');
    return { success: false, error: 'Server configuration error.' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    if (!response.ok) {
      console.error('Turnstile API returned non-OK status:', response.status);
      return { success: false, error: 'Verification service unavailable.' };
    }

    const result = await response.json();

    if (!result.success) {
      const errorCodes = result['error-codes'] || [];
      console.error('Turnstile verification failed:', errorCodes.join(', '));

      if (errorCodes.includes('timeout-or-duplicate')) {
        return { success: false, error: 'Verification expired or already used. Please try again.' };
      }
      if (errorCodes.includes('invalid-input-response')) {
        return { success: false, error: 'Invalid verification token.' };
      }
      return { success: false, error: 'Bot verification failed. Please try again.' };
    }

    // Optional: Validate hostname
    if (env.TURNSTILE_EXPECTED_HOSTNAME && result.hostname !== env.TURNSTILE_EXPECTED_HOSTNAME) {
      console.error('Hostname mismatch:', result.hostname);
      return { success: false, error: 'Verification hostname mismatch.' };
    }

    // Optional: Validate action
    if (env.TURNSTILE_EXPECTED_ACTION && result.action !== env.TURNSTILE_EXPECTED_ACTION) {
      console.error('Action mismatch:', result.action);
      return { success: false, error: 'Verification action mismatch.' };
    }

    return { success: true };
  } catch (err) {
    console.error('Turnstile verification error:', err.message);
    return { success: false, error: 'Verification service error.' };
  }
}
