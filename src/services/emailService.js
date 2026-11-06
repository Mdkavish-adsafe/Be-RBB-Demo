const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendAdminNotification(formData, env) {
  const { name, email, subject, message } = formData;

  const apiKey = env.RESEND_API_KEY;
  const fromAddress = env.RESEND_FROM;
  const adminEmail = env.ADMIN_EMAIL;

  if (!apiKey || !fromAddress || !adminEmail) {
    console.error('Email configuration is incomplete. Check RESEND_API_KEY, RESEND_FROM, ADMIN_EMAIL.');
    return { success: false, error: 'Email service not configured.' };
  }

  // Local demo fallback when real Resend key is not configured
  if (env.MOCK_EMAIL === 'true' || apiKey === 'mock' || apiKey.startsWith('re_your_')) {
    console.log('[LOCAL DEMO] Mock email delivered successfully to admin:');
    console.log({ to: adminEmail, from: fromAddress, subject: emailSubject, reply_to: email, message });
    return { success: true, id: `mock_email_${Date.now()}` };
  }

  const submissionTime = new Date().toISOString();
  const emailSubject = 'New Contact Form Submission – Rising Beyond Borders';

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

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
