'use client';

import { useState } from 'react';

export function LdapLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Authentication failed');
      }

      window.location.href = '/';
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Corporate Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder="username@enterprise.local"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-lg bg-foreground text-background px-6 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all w-full cursor-pointer select-none shadow-sm"
      >
        {loading ? 'Authenticating...' : 'Sign in with Active Directory'}
      </button>
    </form>
  );
}
export default LdapLoginForm;
