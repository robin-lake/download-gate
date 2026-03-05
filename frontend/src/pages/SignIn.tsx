import { SignIn } from '@clerk/clerk-react';

export default function SignInPage() {
  return (
    <div className="app-page clerk-page">
      <SignIn signUpUrl="/signup" fallbackRedirectUrl="/dashboard" />
    </div>
  );
}
