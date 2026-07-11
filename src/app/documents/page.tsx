'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useSWR from 'swr';
import api, { getApiErrorMessage } from '@/lib/api';
import { useConfirm } from '@/components/ConfirmDialog';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
            <Card className="mb-6">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                        <TabsTrigger value="banks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none">
                            {'🏦'} Banks
                        </TabsTrigger>
                        <TabsTrigger value="donors" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none">
                            {'👤'} Donors
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </Card>

            {/* Filter Bar */}
            <Card className="mb-6">
                <CardContent className="py-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium text-foreground">Filter by type:</span>
                        <div className="flex gap-2">
                            <Button
                                variant={filter === 'all' ? 'default' : 'secondary'}
                                size="sm"
                                onClick={() => setFilter('all')}
                            >
                                All ({filteredDocuments.length})
                            </Button>
                            {activeTab === 'banks' && (
                                <Button
                                    variant={filter === 'certification' ? 'default' : 'secondary'}
                                    size="sm"
                                    onClick={() => setFilter('certification')}
                                >
                                    Certifications
                                </Button>
                            )}
                            {activeTab === 'donors' && (
                                <>
                                    <Button
                                        variant={filter === 'consent' ? 'default' : 'secondary'}
                                        size="sm"
                                        onClick={() => setFilter('consent')}
                                    >
                                        Consents
                                    </Button>
                                    <Button
                                        variant={filter === 'test_report' ? 'default' : 'secondary'}
                                        size="sm"
                                        onClick={() => setFilter('test_report')}
                                    >
                                        Test Reports
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Documents Display */}
            {filteredDocuments.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="text-6xl mb-4">{'✅'}</div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">All caught up!</h3>
                    <p className="text-muted-foreground">No pending documents to review in this section.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {Object.entries(groupedDocs).map(([key, docs]) => {
                        const firstDoc = docs[0];
                        const pendingDocs = docs.filter(d => !d.status || d.status === 'pending');

                        return (
                            <Card key={key}>
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="text-4xl">{getDocumentIcon(firstDoc.type)}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge className={
                                                        firstDoc.type === 'certification' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                                                        firstDoc.type === 'consent' ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' :
                                                        'bg-green-100 text-green-800 hover:bg-green-100'
                                                    }>
                                                        {firstDoc.type.replace('_', ' ').toUpperCase()}
                                                    </Badge>
                                                    <Badge variant="secondary" className="rounded-full">
                                                        {docs.length} {firstDoc.type === 'test_report' ? 'report' : 'document'}{docs.length !== 1 ? 's' : ''}
                                                    </Badge>
                                                </div>

                                                <h3 className="text-lg font-semibold text-foreground mb-3">
                                                    {firstDoc.entity_name}
                                                </h3>

                                                {/* List documents */}
                                                <div className="space-y-2">
                                                    {docs.map((doc, idx) => (
                                                        <div key={idx} className="flex items-start justify-between p-3 bg-muted rounded-lg border border-border">
                                                            <div className="flex-1">
                                                                {doc.type === 'test_report' && (
                                                                    <>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <p className="text-sm font-medium text-foreground">
                                                                                {doc.test_name || doc.test_type || 'Test Report'}
                                                                            </p>
                                                                            <StatusBadge status={doc.status} />
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Uploaded: {doc.uploaded_at ? formatDate(doc.uploaded_at) : 'N/A'}
                                                                        </p>
                                                                        {doc.reviewed_at && (
                                                                            <p className="text-xs text-muted-foreground">
                                                                                Reviewed: {formatDate(doc.reviewed_at)} by {doc.reviewed_by || 'Admin'}
                                                                            </p>
                                                                        )}
                                                                    </>
                                                                )}
                                                                {doc.type === 'consent' && (
                                                                    <>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <p className="text-sm font-medium text-foreground">Consent Form</p>
                                                                            <StatusBadge status={doc.status} />
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Signed: {doc.signed_at ? formatDate(doc.signed_at) : 'N/A'}
                                                                        </p>
                                                                    </>
                                                                )}
                                                                {doc.type === 'certification' && doc.document && (
                                                                    <>
                                                                        <p className="text-sm font-medium text-foreground">
                                                                            {doc.document.filename || 'Certification'}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Uploaded: {formatDate(doc.document.uploaded_at)}
                                                                        </p>
                                                                    </>
                                                                )}
                                                            </div>

                                                            <div className="flex gap-2 ml-4">
                                                                {doc.file_url && (
                                                                    <Button
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        onClick={() => viewDocument(doc.file_url!)}
                                                                    >
                                                                        View
                                                                    </Button>
                                                                )}
                                                                {doc.document?.url && (
                                                                    <Button
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        onClick={() => viewDocument(doc.document.url)}
                                                                    >
                                                                        View
                                                                    </Button>
                                                                )}
                                                                {(!doc.status || doc.status === 'pending') && (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            className="bg-green-600 hover:bg-green-700 text-white"
                                                                            onClick={() => handleVerifyDocument(doc)}
                                                                            title="Approve"
                                                                        >
                                                                            {'✓'} Approve
                                                                        </Button>
                                                                        <Button
                                                                            variant="destructive"
                                                                            size="sm"
                                                                            onClick={() => handleRejectDocument(doc)}
                                                                            title="Reject"
                                                                        >
                                                                            {'✗'} Reject
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                            <Button
                                                variant="secondary"
                                                className="w-full"
                                                onClick={() => viewEntity(firstDoc.entity_type, firstDoc.entity_id)}
                                            >
                                                View {firstDoc.entity_type === 'bank' ? 'Bank' : 'Donor'}
                                            </Button>

                                            {pendingDocs.length > 1 && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        className="flex-1"
                                                        onClick={() => handleApproveAll(firstDoc.entity_id, pendingDocs)}
                                                        title="Approve All Pending"
                                                    >
                                                        {'✓'} Approve All
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        className="flex-1"
                                                        onClick={() => handleRejectAll(firstDoc.entity_id, pendingDocs)}
                                                        title="Reject All Pending"
                                                    >
                                                        {'✗'} Reject All
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
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
