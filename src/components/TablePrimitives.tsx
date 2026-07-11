'use client';

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function TableShell({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <Card className={`overflow-hidden ${className}`}>
            <CardContent className="p-0">
                <div className="overflow-x-auto">{children}</div>
            </CardContent>
        </Card>
    );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <tbody>
            {Array.from({ length: rows }).map((_, r) => (
                <tr key={r} className="border-t border-border">
                    {Array.from({ length: cols }).map((_, c) => (
                        <td key={c} className="px-4 py-3">
                            <div
                                className="h-4 rounded animate-pulse bg-muted"
                                style={{ width: `${60 + ((r + c) % 3) * 15}%` }}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    );
}

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
            <svg className="w-12 h-12 mb-3 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm font-medium text-foreground">{title}</p>
            {description && <p className="mt-1 text-sm max-w-sm text-muted-foreground">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

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
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background">
            <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
                {typeof totalItems === 'number' && ` · ${totalItems} total`}
            </p>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
                    Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
                    Next
                </Button>
            </div>
        </div>
    );
}
