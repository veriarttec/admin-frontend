'use client';

import { ReactNode, useState } from 'react';

/** Lightweight hover/focus tooltip for icon-only buttons and dense UI. */
export default function Tooltip({
    label,
    children,
    side = 'top',
}: {
    label: string;
    children: ReactNode;
    side?: 'top' | 'bottom';
}) {
    const [visible, setVisible] = useState(false);

    return (
        <span
            className="relative inline-flex"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            onFocus={() => setVisible(true)}
            onBlur={() => setVisible(false)}
        >
            {children}
            {visible && (
                <span
                    role="tooltip"
                    className={`absolute left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs text-white shadow-lg pointer-events-none ${
                        side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                    }`}
                    style={{ background: 'var(--sidebar-active)' }}
                >
                    {label}
                </span>
            )}
        </span>
    );
}
