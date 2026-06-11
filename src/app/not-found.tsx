import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "#FAFEFF" }}>
      <div className="max-w-md w-full text-center">
        <p className="text-7xl font-bold" style={{ color: "var(--accent)" }}>
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold" style={{ color: "var(--sidebar-active)" }}>
          Page not found
        </h1>
        <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
          The page you are looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-block px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
