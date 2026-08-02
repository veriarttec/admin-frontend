// Best-effort crash reporting for React error boundaries (error.tsx /
// global-error.tsx). Deliberately not routed through the API client — the
// crash could itself be that client's fault — and never throws, since
// reporting an error must never itself become a second error.
export function reportError(error: Error, path: string) {
  try {
    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001').replace(/\/+$/, '');
    fetch(`${base}/api/public/log-frontend-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error?.message || String(error),
        stack: error?.stack,
        path,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Error reporting must never itself throw.
  }
}
