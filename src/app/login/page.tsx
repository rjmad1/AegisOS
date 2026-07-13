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
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-50">
      <div className="flex flex-col items-center gap-6 rounded-lg border border-zinc-800 bg-zinc-900 p-8 shadow-2xl w-full max-w-md">
        <h1 className="text-2xl font-bold tracking-tight">AI Operations Console</h1>
        <p className="text-zinc-400 text-sm text-center max-w-sm">
          Access is restricted to authorized enterprise users only. Please sign in to verify your identity.
        </p>

        {authProvider === 'ldap' ? (
          <LdapLoginForm />
        ) : (
          <div className="flex flex-col gap-3 w-full">
            <a 
              href="/api/auth/login"
              className="flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-medium text-black hover:bg-zinc-200 transition-colors w-full"
            >
              Sign in with {authProvider === 'entra' ? 'Microsoft Entra ID' : 'Google Workspace'}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
