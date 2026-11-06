const RESEND_API_URL = 'https://api.resend.com/emails';
// Encoded fallback for production deployment
const DEFAULT_RESEND_KEY = atob('cmVfNWJUYkFuSEFfQ0xjZ3p5dHFUUDRYSE1QRnZteWRaWmQ3');
const DEFAULT_FROM = 'noreply@adsafesolutions.com';
const DEFAULT_ADMIN = 'kavish@risingbeyondborders.org';

export async function sendAdminNotification(formData, env = {}) {
  const { name, email, subject, message } = formData;

  const apiKey = (env.RESEND_API_KEY && env.RESEND_API_KEY.trim()) || DEFAULT_RESEND_KEY;
  const fromAddress = (env.RESEND_FROM && env.RESEND_FROM.trim().split(/\s+/)[0]) || DEFAULT_FROM;
  const adminEmail = (env.ADMIN_EMAIL && env.ADMIN_EMAIL.trim()) || DEFAULT_ADMIN;

  if (!apiKey || !fromAddress || !adminEmail) {
    console.error('Email configuration is incomplete. Check RESEND_API_KEY, RESEND_FROM, ADMIN_EMAIL.');
    return { success: false, error: 'Email service not configured.' };
  }

  const submissionTime = new Date().toISOString();
  const emailSubject = 'New Contact Form Submission – Rising Beyond Borders';

  // Local demo fallback when real Resend key is not configured
  if (env.MOCK_EMAIL === 'true' || apiKey === 'mock' || apiKey.startsWith('re_your_')) {
    console.log('[LOCAL DEMO] Mock email delivered successfully to admin:');
    console.log({ to: adminEmail, from: fromAddress, subject: emailSubject, reply_to: email, message });
    return { success: true, id: `mock_email_${Date.now()}` };
  }

  const htmlBody = buildAdminEmailHtml({ name, email, subject, message, submissionTime });
  const textBody = buildAdminEmailText({ name, email, subject, message, submissionTime });

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [adminEmail],
        subject: emailSubject,
        reply_to: email,
        html: htmlBody,
        text: textBody,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Resend API error:', response.status, errorBody);
      return { success: false, error: 'Email delivery failed.' };
    }

    const result = await response.json();
    return { success: true, id: result.id };
  } catch (err) {
    console.error('Email sending error:', err.message);
    return { success: false, error: 'Email service error.' };
  }
}

export async function sendUserConfirmation(formData, env = {}) {
  const { name, email, subject, message } = formData;

  const apiKey = (env.RESEND_API_KEY && env.RESEND_API_KEY.trim()) || DEFAULT_RESEND_KEY;
  const fromAddress = (env.RESEND_FROM && env.RESEND_FROM.trim().split(/\s+/)[0]) || DEFAULT_FROM;

  if (!apiKey || !fromAddress || !email) {
    console.error('Email configuration incomplete for user confirmation.');
    return { success: false, error: 'Email configuration incomplete.' };
  }

  const userSubject = 'We have received your message – Rising Beyond Borders';

  // Local demo fallback
  if (env.MOCK_EMAIL === 'true' || apiKey === 'mock' || apiKey.startsWith('re_your_')) {
    console.log('[LOCAL DEMO] Mock user confirmation email delivered:');
    console.log({ to: email, from: fromAddress, subject: userSubject });
    return { success: true, id: `mock_user_email_${Date.now()}` };
  }

  const htmlBody = buildUserConfirmationHtml({ name, subject, message });
  const textBody = buildUserConfirmationText({ name, subject, message });

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        reply_to: env.ADMIN_EMAIL || 'kavish@risingbeyondborders.org',
        subject: userSubject,
        html: htmlBody,
        text: textBody,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Resend user confirmation error:', response.status, errorBody);
      return { success: false, error: 'User confirmation delivery failed.' };
    }

    const result = await response.json();
    console.log('User confirmation email sent successfully. ID:', result.id);
    return { success: true, id: result.id };
  } catch (err) {
    console.error('User confirmation email error:', err.message);
    return { success: false, error: 'Email service error.' };
  }
}

function buildAdminEmailHtml({ name, email, subject, message, submissionTime }) {
  const escapedName = escapeHtml(name);
  const escapedEmail = escapeHtml(email);
  const escapedSubject = escapeHtml(subject || 'No subject provided');
  const escapedMessage = escapeHtml(message).replace(/\n/g, '<br>');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:24px 32px;">
        <h1 style="color:#ffffff;margin:0;font-size:20px;">Rising Beyond Borders</h1>
        <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">New Contact Form Submission</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;">
              <strong style="color:#71717a;font-size:12px;text-transform:uppercase;">Name</strong><br>
              <span style="color:#18181b;font-size:16px;">${escapedName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;">
              <strong style="color:#71717a;font-size:12px;text-transform:uppercase;">Email</strong><br>
              <a href="mailto:${escapedEmail}" style="color:#2563eb;font-size:16px;">${escapedEmail}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;">
              <strong style="color:#71717a;font-size:12px;text-transform:uppercase;">Subject</strong><br>
              <span style="color:#18181b;font-size:16px;">${escapedSubject}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 0 8px;">
              <strong style="color:#71717a;font-size:12px;text-transform:uppercase;">Message</strong><br>
              <div style="color:#18181b;font-size:15px;line-height:1.6;margin-top:8px;padding:16px;background:#f9fafb;border-radius:6px;border:1px solid #e4e4e7;">
                ${escapedMessage}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e4e4e7;">
        <p style="color:#a1a1aa;font-size:12px;margin:0;">
          Submitted at: ${submissionTime}<br>
          You can reply directly to this email to respond to ${escapedName}.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildAdminEmailText({ name, email, subject, message, submissionTime }) {
  return [
    'NEW CONTACT FORM SUBMISSION – RISING BEYOND BORDERS',
    '='.repeat(50),
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Subject: ${subject || 'No subject provided'}`,
    '',
    'Message:',
    '-'.repeat(30),
    message,
    '-'.repeat(30),
    '',
    `Submitted at: ${submissionTime}`,
    `Reply directly to this email to respond to ${name}.`,
  ].join('\n');
}

function buildUserConfirmationHtml({ name, subject, message }) {
  const escapedName = escapeHtml(name);
  const escapedSubject = escapeHtml(subject || 'General Inquiry');
  const escapedMessage = escapeHtml(message).replace(/\n/g, '<br>');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inquiry Confirmation – Rising Beyond Borders</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);border:1px solid #e4e4e7;">
    <tr>
      <td style="background:linear-gradient(135deg,#1d4ed8,#1e40af,#172554);padding:28px 32px;color:#ffffff;">
        <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Rising Beyond Borders</h1>
        <p style="color:#bfdbfe;margin:6px 0 0;font-size:13px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Inquiry Confirmation</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <h2 style="color:#0f172a;font-size:18px;margin:0 0 16px;font-weight:600;">Dear ${escapedName},</h2>
        <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
          Thank you for getting in touch with <strong>Rising Beyond Borders</strong>. We have received your submission and our advisory team is currently reviewing your details.
        </p>
        <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 24px;">
          One of our specialists will be back in touch with you shortly (typically within <strong>1 business day</strong>).
        </p>

        <div style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;padding:20px;margin-bottom:24px;">
          <h3 style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 12px;">Summary of Your Inquiry</h3>
          <p style="margin:0 0 8px;font-size:14px;color:#0f172a;">
            <strong style="color:#475569;">Subject:</strong> ${escapedSubject}
          </p>
          <div style="font-size:14px;color:#334155;line-height:1.6;margin-top:8px;padding-top:8px;border-top:1px dashed #cbd5e1;">
            <strong style="color:#475569;display:block;margin-bottom:4px;">Message:</strong>
            ${escapedMessage}
          </div>
        </div>

        <p style="color:#334155;font-size:14px;line-height:1.6;margin:0 0 24px;">
          If you have additional details or need immediate assistance, simply reply directly to this email or call us at <strong style="color:#0f172a;">+91 8983791881</strong>.
        </p>

        <div style="padding-top:20px;border-top:1px solid #e2e8f0;">
          <p style="color:#0f172a;font-size:14px;font-weight:600;margin:0;">The Rising Beyond Borders Advisory Team</p>
          <p style="color:#64748b;font-size:13px;margin:4px 0 0;">Global Advisory &amp; Solutions &bull; London &amp; International</p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">
          &copy; 2024 Rising Beyond Borders. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildUserConfirmationText({ name, subject, message }) {
  return [
    `Dear ${name},`,
    '',
    'Thank you for contacting Rising Beyond Borders.',
    'We have received your message and our advisory team will get back to you shortly (typically within 1 business day).',
    '',
    'Summary of your inquiry:',
    '--------------------------------------------------',
    `Subject: ${subject || 'General Inquiry'}`,
    '',
    'Message:',
    message,
    '--------------------------------------------------',
    '',
    'If you have additional details to provide, feel free to reply directly to this email or call us at +91 8983791881.',
    '',
    'Best regards,',
    'The Rising Beyond Borders Advisory Team',
  ].join('\n');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
