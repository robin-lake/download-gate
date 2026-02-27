import { useState, useCallback } from 'react';
import { useCreateUser } from '../network/createUser';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const { createUser, data, error, isLoading, status } = useCreateUser();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      if (!trimmedName || !trimmedEmail) return;
      createUser(trimmedName, trimmedEmail);
    },
    [name, email, createUser]
  );

  return (
    <div className="signup-page">
      <h1>Sign up</h1>
      <form onSubmit={handleSubmit} className="signup-form">
        <div className="form-field">
          <label htmlFor="signup-name">Name</label>
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            autoComplete="name"
            disabled={isLoading}
          />
        </div>
        <div className="form-field">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            disabled={isLoading}
          />
        </div>
        {error && (
          <div className="form-error" role="alert">
            {error.message}
          </div>
        )}
        {status === 'success' && data && (
          <div className="form-success" role="status">
            Account created. Welcome, {data.name}.
          </div>
        )}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
