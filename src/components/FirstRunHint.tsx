'use client';

import { ReactNode, useEffect, useState } from 'react';

/**
 * Dismissible first-visit callout. Shown once per `hintKey` per browser;
 * dismissal is remembered in localStorage.
 */
export default function FirstRunHint({
    hintKey,
    title,
    children,
}: {
    hintKey: string;
    title: string;
    children: ReactNode;
}) {
    const storageKey = `hint_${hintKey}_dismissed`;
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem(storageKey)) setVisible(true);
    }, [storageKey]);

    if (!visible) return null;

    return (
        <div
            className="mb-6 rounded-lg p-4 flex items-start gap-3"
            style={{ border: '1px solid var(--accent)', background: 'rgba(15, 164, 166, 0.06)' }}
        >
            <svg className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--sidebar-active)' }}>{title}</p>
                <div className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{children}</div>
            </div>
            <button
                onClick={() => {
                    localStorage.setItem(storageKey, '1');
                    setVisible(false);
                }}
                className="transition-colors shrink-0"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Dismiss hint"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
