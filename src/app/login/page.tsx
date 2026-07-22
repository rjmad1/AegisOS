import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LdapLoginForm } from './LdapLoginForm';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_session')?.value;
  if (token) {
    redirect('/');
  }

  const authProvider = process.env.AUTH_PROVIDER || 'google';

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background text-foreground p-4">
      <div className="flex flex-col items-center gap-6 rounded-xl border border-border/80 bg-card p-8 shadow-xl w-full max-w-md glass-panel">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">AI Operations Console</h1>
        <p className="text-muted-foreground text-sm text-center max-w-sm leading-relaxed">
          Access is restricted to authorized enterprise users only. Please sign in to verify your identity.
        </p>

        {authProvider === 'ldap' ? (
          <LdapLoginForm />
        ) : (
          <div className="flex flex-col gap-3 w-full">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a 
              href="/api/auth/login"
              className="flex items-center justify-center gap-2 rounded-lg bg-foreground text-background px-6 py-2.5 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all w-full select-none shadow-sm cursor-pointer"
            >
              Sign in with {authProvider === 'entra' ? 'Microsoft Entra ID' : 'Google Workspace'}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
