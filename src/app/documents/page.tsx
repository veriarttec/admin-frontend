'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useSWR from 'swr';
import api, { getApiErrorMessage } from '@/lib/api';
import { useConfirm } from '@/components/ConfirmDialog';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';

interface PendingDocument {
    type: string;
    entity_type: string;
    entity_id: string;
    entity_name: string;
    document_index?: number;
    document?: any;
    consent_id?: string;
    report_id?: string;
    uploaded_at?: string;
    signed_at?: string;
    test_type?: string;
    test_name?: string;
    file_url?: string;
    status?: string;
    reviewed_at?: string;
    reviewed_by?: string;
    review_notes?: string;
}

export default function DocumentsPage() {
    const confirm = useConfirm();
    const [activeTab, setActiveTab] = useState<'banks' | 'donors'>('donors');
    const [filter, setFilter] = useState<string>('all');
    const router = useRouter();

    const { data: documentsResponse, isLoading: loading, mutate } = useSWR(
        'pending-documents',
        () => api.getPendingDocuments(),
        {
            refreshInterval: 30_000,
            onError: (err) => {
                if (err instanceof Error && err.message.includes('401')) {
                    router.push('/login');
                }
            },
        }
    );

    const documents: PendingDocument[] = documentsResponse?.pending_documents ?? [];

    // Filter documents by entity type and document type
    const filteredDocuments = documents.filter(doc => {
        // Tab filter
        if (activeTab === 'banks' && doc.entity_type !== 'bank') return false;
        if (activeTab === 'donors' && doc.entity_type !== 'donor') return false;

        // Document type filter
        if (filter !== 'all' && doc.type !== filter) return false;

        return true;
    });

    const handleVerifyDocument = async (doc: PendingDocument) => {
        const notes = await confirm({
            title: 'Approve document',
            input: { label: 'Verification notes (optional)', required: false },
        }) as string | null;
        if (notes === null) return;
        try {
            if (doc.type === 'certification' && doc.document_index !== undefined) {
                await api.verifyBankDocument(doc.entity_id, doc.document_index, notes || undefined);
            } else if (doc.type === 'consent' && doc.consent_id) {
                await api.approveConsent(doc.entity_id, notes || undefined);
            } else if (doc.type === 'test_report' && doc.report_id) {
                await api.approveTestReport(doc.entity_id, doc.report_id, notes || undefined);
            }
            mutate();
            toast.success('Document approved successfully');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleRejectDocument = async (doc: PendingDocument) => {
        const reason = await confirm({
            title: 'Reject document',
            destructive: true,
            input: { label: 'Rejection reason', required: true, multiline: true },
        }) as string | null;
        if (reason === null) return;
        try {
            if (doc.type === 'certification' && doc.document_index !== undefined) {
                await api.rejectBankDocument(doc.entity_id, doc.document_index, reason);
            } else if (doc.type === 'consent' && doc.consent_id) {
                await api.rejectConsent(doc.entity_id, reason);
            } else if (doc.type === 'test_report' && doc.report_id) {
                await api.rejectTestReport(doc.entity_id, doc.report_id, reason);
            }
            mutate();
            toast.success('Document rejected');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleApproveAll = async (entityId: string, entityDocs: PendingDocument[]) => {
        const notes = await confirm({
            title: 'Approve all documents',
            input: { label: 'Approval notes (optional)', required: false },
        }) as string | null;
        if (notes === null) return;
        try {
            const firstDoc = entityDocs[0];
            if (firstDoc.type === 'test_report') {
                for (const doc of entityDocs) {
                    if (doc.report_id) {
                        await api.approveTestReport(entityId, doc.report_id, notes || undefined);
                    }
                }
            } else if (firstDoc.type === 'consent') {
                await api.approveConsent(entityId, notes || undefined);
            }
            mutate();
            toast.success(`All ${firstDoc.type}s approved successfully`);
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleRejectAll = async (entityId: string, entityDocs: PendingDocument[]) => {
        const reason = await confirm({
            title: 'Reject all documents',
            destructive: true,
            input: { label: 'Rejection reason', required: true, multiline: true },
        }) as string | null;
        if (reason === null) return;
        try {
            const firstDoc = entityDocs[0];
            if (firstDoc.type === 'test_report') {
                for (const doc of entityDocs) {
                    if (doc.report_id) {
                        await api.rejectTestReport(entityId, doc.report_id, reason);
                    }
                }
            } else if (firstDoc.type === 'consent') {
                await api.rejectConsent(entityId, reason);
            }
            mutate();
            toast.success(`All ${firstDoc.type}s rejected`);
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const viewDocument = (url: string) => {
        const name = decodeURIComponent(url.split('?')[0].split('/').pop() || 'Document');
        router.push(`/documents/view?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`);
    };

    const viewEntity = (entityType: string, entityId: string) => {
        if (entityType === 'bank') {
            router.push(`/banks/${entityId}`);
        } else if (entityType === 'donor') {
            router.push(`/donors/${entityId}`);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Group documents by entity
    const groupedDocs: { [key: string]: PendingDocument[] } = {};
    filteredDocuments.forEach(doc => {
        const key = `${doc.entity_type}-${doc.entity_id}`;
        if (!groupedDocs[key]) {
            groupedDocs[key] = [];
        }
        groupedDocs[key].push(doc);
    });


    const getDocumentIcon = (type: string) => {
        switch (type) {
            case 'certification':
                return '📜';
            case 'consent':
                return '✍️';
            case 'test_report':
                return '🧪';
            default:
                return '📄';
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-8">
                    <div className="text-center">Loading...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Documents Review">
            {/* Tab Navigation */}
            <div className="table-card mb-6">
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('banks')}
                        className={`px-6 py-3 font-medium ${
                            activeTab === 'banks'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        🏦 Banks
                    </button>
                    <button
                        onClick={() => setActiveTab('donors')}
                        className={`px-6 py-3 font-medium ${
                            activeTab === 'donors'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        👤 Donors
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="table-card mb-6">
                <div className="p-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium text-gray-700">Filter by type:</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                    filter === 'all'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                All ({filteredDocuments.length})
                            </button>
                            {activeTab === 'banks' && (
                                <button
                                    onClick={() => setFilter('certification')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        filter === 'certification'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Certifications
                                </button>
                            )}
                            {activeTab === 'donors' && (
                                <>
                                    <button
                                        onClick={() => setFilter('consent')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                            filter === 'consent'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Consents
                                    </button>
                                    <button
                                        onClick={() => setFilter('test_report')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                            filter === 'test_report'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Test Reports
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Documents Display */}
            {filteredDocuments.length === 0 ? (
                <div className="table-card p-12 text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
                    <p className="text-gray-600">No pending documents to review in this section.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {Object.entries(groupedDocs).map(([key, docs]) => {
                        const firstDoc = docs[0];
                        const pendingDocs = docs.filter(d => !d.status || d.status === 'pending');

                        return (
                            <div key={key} className="table-card">
                                <div className="p-6">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="text-4xl">{getDocumentIcon(firstDoc.type)}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-3 py-1 rounded text-xs font-medium ${
                                                        firstDoc.type === 'certification' ? 'bg-blue-100 text-blue-800' :
                                                        firstDoc.type === 'consent' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        {firstDoc.type.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                    <span className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full font-medium">
                                                        {docs.length} {firstDoc.type === 'test_report' ? 'report' : 'document'}{docs.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>

                                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                                    {firstDoc.entity_name}
                                                </h3>

                                                {/* List documents */}
                                                <div className="space-y-2">
                                                    {docs.map((doc, idx) => (
                                                        <div key={idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                            <div className="flex-1">
                                                                {doc.type === 'test_report' && (
                                                                    <>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <p className="text-sm font-medium text-gray-900">
                                                                                {doc.test_name || doc.test_type || 'Test Report'}
                                                                            </p>
                                                                            <StatusBadge status={doc.status} />
                                                                        </div>
                                                                        <p className="text-xs text-gray-500">
                                                                            Uploaded: {doc.uploaded_at ? formatDate(doc.uploaded_at) : 'N/A'}
                                                                        </p>
                                                                        {doc.reviewed_at && (
                                                                            <p className="text-xs text-gray-500">
                                                                                Reviewed: {formatDate(doc.reviewed_at)} by {doc.reviewed_by || 'Admin'}
                                                                            </p>
                                                                        )}
                                                                    </>
                                                                )}
                                                                {doc.type === 'consent' && (
                                                                    <>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <p className="text-sm font-medium text-gray-900">Consent Form</p>
                                                                            <StatusBadge status={doc.status} />
                                                                        </div>
                                                                        <p className="text-xs text-gray-500">
                                                                            Signed: {doc.signed_at ? formatDate(doc.signed_at) : 'N/A'}
                                                                        </p>
                                                                    </>
                                                                )}
                                                                {doc.type === 'certification' && doc.document && (
                                                                    <>
                                                                        <p className="text-sm font-medium text-gray-900">
                                                                            {doc.document.filename || 'Certification'}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500">
                                                                            Uploaded: {formatDate(doc.document.uploaded_at)}
                                                                        </p>
                                                                    </>
                                                                )}
                                                            </div>

                                                            <div className="flex gap-2 ml-4">
                                                                {doc.file_url && (
                                                                    <button
                                                                        onClick={() => viewDocument(doc.file_url!)}
                                                                        className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                                                                    >
                                                                        View
                                                                    </button>
                                                                )}
                                                                {doc.document?.url && (
                                                                    <button
                                                                        onClick={() => viewDocument(doc.document.url)}
                                                                        className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                                                                    >
                                                                        View
                                                                    </button>
                                                                )}
                                                                {(!doc.status || doc.status === 'pending') && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleVerifyDocument(doc)}
                                                                            className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded"
                                                                            title="Approve"
                                                                        >
                                                                            ✓ Approve
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleRejectDocument(doc)}
                                                                            className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded"
                                                                            title="Reject"
                                                                        >
                                                                            ✗ Reject
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                            <button
                                                onClick={() => viewEntity(firstDoc.entity_type, firstDoc.entity_id)}
                                                className="btn-secondary w-full"
                                            >
                                                View {firstDoc.entity_type === 'bank' ? 'Bank' : 'Donor'}
                                            </button>

                                            {pendingDocs.length > 1 && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApproveAll(firstDoc.entity_id, pendingDocs)}
                                                        className="btn-primary flex-1"
                                                        title="Approve All Pending"
                                                    >
                                                        ✓ Approve All
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectAll(firstDoc.entity_id, pendingDocs)}
                                                        className="btn-danger flex-1"
                                                        title="Reject All Pending"
                                                    >
                                                        ✗ Reject All
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Summary */}
            {filteredDocuments.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                        <strong>{filteredDocuments.length}</strong> document{filteredDocuments.length !== 1 ? 's' : ''} in this view
                    </p>
                </div>
            )}
        </DashboardLayout>
    );
}
