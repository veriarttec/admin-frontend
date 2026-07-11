'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    banks: 'Banks',
    donors: 'Donors',
    subscriptions: 'Subscriptions',
    documents: 'Documents',
    view: 'View',
};

function labelFor(segment: string): string {
    if (LABELS[segment]) return LABELS[segment];
    if (segment.length > 12) return `${segment.slice(0, 8)}…`;
    return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Path-based breadcrumbs; hidden on top-level pages. */
export default function Breadcrumbs() {
    const pathname = usePathname();
    if (!pathname) return null;

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length < 2) return null;

    return (
        <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 text-sm flex-wrap text-muted-foreground">
                <li>
                    <Link href="/dashboard" className="hover:underline">
                        Dashboard
                    </Link>
                </li>
                {segments.map((segment, i) => {
                    const href = `/${segments.slice(0, i + 1).join('/')}`;
                    const isLast = i === segments.length - 1;
                    return (
                        <li key={href} className="flex items-center gap-1.5">
                            <span className="text-border">/</span>
                            {isLast ? (
                                <span className="font-medium text-foreground">
                                    {labelFor(segment)}
                                </span>
                            ) : (
                                <Link href={href} className="hover:underline">
                                    {labelFor(segment)}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
