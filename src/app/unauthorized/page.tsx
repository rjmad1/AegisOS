export default async function UnauthorizedPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-50">
      <div className="flex flex-col items-center gap-6 rounded-lg border border-red-900/50 bg-zinc-900 p-8 shadow-2xl">
        <div className="text-red-500 rounded-full bg-red-500/10 p-3">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-zinc-400 text-sm text-center max-w-sm">
          Your identity has been verified, but this account has not been authorized to access this platform.
        </p>
        <p className="text-zinc-500 text-xs text-center max-w-sm">
          If you believe this is an error, please contact the Administrator.
        </p>
        <div className="flex gap-4 mt-4 w-full">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a 
            href="/api/auth/logout"
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white transition-colors"
          >
            Sign Out
          </a>
        </div>
      </div>
    </div>
  );
}
