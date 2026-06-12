'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api, { getApiErrorMessage } from '@/lib/api';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

function isImage(name: string, url: string): boolean {
    const source = (name || url).toLowerCase().split('?')[0];
    return IMAGE_EXTENSIONS.some((ext) => source.endsWith(ext));
}

function ViewerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const docUrl = searchParams.get('url') || '';
    const bucket = searchParams.get('bucket') || '';
    const path = searchParams.get('path') || '';
    const docName = searchParams.get('name') || 'Document';

    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchSignedUrl = useCallback(async () => {
        if (!docUrl && !(bucket && path)) {
            setError('No document specified');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = docUrl
                ? await api.getSignedDocumentUrlFromStoredUrl(docUrl)
                : await api.getSignedDocumentUrl(bucket, path);
            setSignedUrl(response.url);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to open this document'));
        } finally {
            setLoading(false);
        }
    }, [docUrl, bucket, path]);

    useEffect(() => {
        fetchSignedUrl();
    }, [fetchSignedUrl]);

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAFEFF' }}>
            <header
                className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4 bg-white"
                style={{ borderBottom: '1px solid var(--border-color)' }}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <span style={{ color: 'var(--border-color)' }}>|</span>
                    <h1 className="text-sm font-semibold truncate" style={{ color: 'var(--sidebar-active)' }}>
                        {docName}
                    </h1>
                </div>
                <p className="text-xs shrink-0 hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                    Secure link · expires in 1 hour
                </p>
            </header>

            <main className="flex-1 flex items-center justify-center p-4">
                {loading && (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--accent)' }}></div>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Opening document...</p>
                    </div>
                )}
                {!loading && error && (
                    <div className="text-center max-w-sm">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Couldn&apos;t open document</p>
                        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
                        <button onClick={fetchSignedUrl} className="btn-primary mt-4">
                            Try again
                        </button>
                    </div>
                )}
                {!loading && !error && signedUrl && (
                    isImage(docName, docUrl || path) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={signedUrl} alt={docName} className="max-h-[85vh] max-w-full rounded-lg shadow-md" />
                    ) : (
                        <iframe
                            src={signedUrl}
                            title={docName}
                            className="w-full h-[85vh] rounded-lg shadow-md bg-white"
                        />
                    )
                )}
            </main>
        </div>
    );
}

export default function DocumentViewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: '#FAFEFF' }} />}>
            <ViewerContent />
        </Suspense>
    );
}
