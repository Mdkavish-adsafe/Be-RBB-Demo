import { z } from 'zod';

const contactSchema = z.object({
  name: z
    .string({ required_error: 'Full name is required.' })
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must not exceed 100 characters.'),
  email: z
    .string({ required_error: 'Email address is required.' })
    .trim()
    .email('Please provide a valid email address.')
    .max(254, 'Email must not exceed 254 characters.'),
  subject: z
    .string()
    .trim()
    .max(200, 'Subject must not exceed 200 characters.')
    .optional()
    .default(''),
  message: z
    .string({ required_error: 'Message is required.' })
    .trim()
    .min(10, 'Message must be at least 10 characters.')
    .max(2000, 'Message must not exceed 2000 characters.'),
  turnstileToken: z
    .string({ required_error: 'Bot verification token is required.' })
    .min(1, 'Bot verification token is required.'),
});

export function validateContactForm(data) {
  const result = contactSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
  return { success: false, errors };
}

export { contactSchema };
