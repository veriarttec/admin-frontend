'use client';

import { ReactNode } from 'react';
import { SWRConfig } from 'swr';

/**
 * Global SWR defaults: data revalidates when the window regains focus or the
 * network reconnects, so screens stay current without manual reloads.
 * Pages opt into background polling per-hook via refreshInterval.
 */
export default function SWRProvider({ children }: { children: ReactNode }) {
    return (
        <SWRConfig
            value={{
                revalidateOnFocus: true,
                revalidateOnReconnect: true,
                dedupingInterval: 5000,
                errorRetryCount: 2,
            }}
        >
            {children}
        </SWRConfig>
    );
}
