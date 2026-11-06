export function errorHandler(err, c) {
  console.error('Unhandled error:', err.message);

  // Don't expose internal error details in production
  return c.json(
    {
      success: false,
      error: 'An unexpected error occurred. Please try again later.',
    },
    500
  );
}
