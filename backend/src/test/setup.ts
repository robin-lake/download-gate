// Set Clerk env so clerkMiddleware() does not throw in tests (e.g. app.test.ts)
process.env.CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY ?? 'pk_test_placeholder';
process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? 'sk_test_placeholder';
