import { SignUp } from '@clerk/clerk-react';

export default function SignUpPage() {
  return (
    <div className="app-page clerk-page">
      <SignUp signInUrl="/login" fallbackRedirectUrl="/dashboard" />
    </div>
  );
}
