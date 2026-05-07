import { SignIn } from '@clerk/clerk-react';

export default function SignInPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <SignIn signUpUrl="/signup" fallbackRedirectUrl="/dashboard" />
    </div>
  );
}
