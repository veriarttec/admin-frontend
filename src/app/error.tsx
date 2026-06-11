"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "#FAFEFF" }}>
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold" style={{ color: "var(--sidebar-active)" }}>
          Something went wrong
        </h1>
        <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
          An unexpected error occurred. You can try again, or head back to the dashboard.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
