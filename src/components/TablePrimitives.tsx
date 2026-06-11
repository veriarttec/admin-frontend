'use client';

import { ReactNode } from 'react';

/** Card wrapper giving every table the same chrome. */
export function TableShell({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={`glass-card overflow-hidden ${className}`} style={{ padding: 0 }}>
            <div className="overflow-x-auto">{children}</div>
        </div>
    );
}

/** Skeleton rows shown while table data loads. */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <tbody>
            {Array.from({ length: rows }).map((_, r) => (
                <tr key={r} style={{ borderTop: '1px solid var(--border-color)' }}>
                    {Array.from({ length: cols }).map((_, c) => (
                        <td key={c} className="px-4 py-3">
                            <div
                                className="h-4 rounded animate-pulse"
                                style={{ background: 'var(--hover-bg)', width: `${60 + ((r + c) % 3) * 15}%` }}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    );
}

/** Empty state with optional call to action. */
export function EmptyState({
    title,
    description,
    action,
}: {
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <svg className="w-12 h-12 mb-3" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</p>
            {description && <p className="mt-1 text-sm max-w-sm" style={{ color: 'var(--text-muted)' }}>{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

/** Previous/next pagination bar. */
export function Pagination({
    page,
    totalPages,
    onPageChange,
    totalItems,
}: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
}) {
    if (totalPages <= 1) return null;
    return (
        <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid var(--border-color)', background: 'var(--background)' }}
        >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Page {page} of {totalPages}
                {typeof totalItems === 'number' && ` · ${totalItems} total`}
            </p>
            <div className="flex gap-2">
                <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="btn-outline">
                    Previous
                </button>
                <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="btn-outline">
                    Next
                </button>
            </div>
        </div>
    );
}
