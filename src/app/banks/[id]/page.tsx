'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import useSWR from 'swr';
import api, { getApiErrorMessage } from '@/lib/api';
import { useConfirm } from '@/components/ConfirmDialog';
import DashboardLayout from '@/components/DashboardLayout';

interface BankFullDetail {
    id: string;
    email: string;
    name: string;
    state: string;
    phone: string | null;
    address: string | null;
    website: string | null;
    description: string | null;
    certification_documents: any;
    is_verified: boolean;
    verified_at: string | null;
    verified_by: string | null;
    is_subscribed: boolean;
    subscription_tier: string | null;
    subscription_started_at: string | null;
    subscription_expires_at: string | null;
    billing_details: any;
    counseling_config: any;
    logo_url: string | null;
    donor_count: number;
    consent_template_count: number;
    created_at: string;
    updated_at: string | null;
}

export default function BankDetailPage() {
    const confirm = useConfirm();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [activeTab, setActiveTab] = useState('overview');
    const router = useRouter();
    const params = useParams();
    const bankId = params.id as string;

    const { data: bank, isLoading, error, mutate } = useSWR<BankFullDetail>(
        bankId ? ['bank', bankId] : null,
        () => api.getBankFullDetails(bankId),
        {
            onSuccess: (data) => {
                setEditData({
                    name: data.name,
                    phone: data.phone,
                    address: data.address,
                    website: data.website,
                    description: data.description,
                });
            },
            onError: (err) => {
                if (err instanceof Error && err.message.includes('401')) {
                    router.push('/login');
                }
            },
        }
    );

    const { data: storageDocuments, mutate: mutateStorage } = useSWR(
        bankId ? ['bank-storage', bankId] : null,
        () => api.getBankStorageDocuments(bankId),
        {
            onError: () => {
                // Storage documents are best-effort; swallow errors silently
            },
        }
    );

    const handleSaveEdit = async () => {
        try {
            await api.updateBank(bankId, editData);
            mutate();
            setIsEditing(false);
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleVerify = async () => {
        if (!(await confirm({
            title: 'Verify this bank?',
            confirmLabel: 'Verify bank',
        }))) return;
        try {
            await api.verifyBank(bankId, 'admin', 'Verified via admin portal');
            mutate();
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleStateChange = async (newState: string) => {
        const reason = await confirm({
            title: 'Change bank state',
            input: { label: 'Reason for state change', required: true },
        }) as string | null;
        if (reason === null) return;
        try {
            await api.changeBankState(bankId, newState, reason);
            mutate();
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleVerifyDocument = async (docIndex: number) => {
        const notes = await confirm({
            title: 'Verify document',
            input: { label: 'Verification notes (optional)', required: false },
        }) as string | null;
        if (notes === null) return;
        try {
            await api.verifyBankDocument(bankId, docIndex, notes || undefined);
            mutate();
            toast.success('Document verified successfully');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleRejectDocument = async (docIndex: number) => {
        const reason = await confirm({
            title: 'Reject document',
            destructive: true,
            input: { label: 'Rejection reason', required: true, multiline: true },
        }) as string | null;
        if (reason === null) return;
        try {
            await api.rejectBankDocument(bankId, docIndex, reason);
            mutate();
            toast.success('Document rejected');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout title="Bank">
                <div className="p-8 text-gray-500">Loading bank details...</div>
            </DashboardLayout>
        );
    }

    const errorMessage = error ? getApiErrorMessage(error, 'Failed to load bank') : '';

    if (errorMessage || !bank) {
        return (
            <DashboardLayout title="Bank">
                <div className="p-8 text-red-500">{errorMessage || 'Bank not found'}</div>
            </DashboardLayout>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'documents', label: 'Documents' },
        { id: 'subscription', label: 'Subscription' },
        { id: 'donors', label: `Donors (${bank.donor_count})` },
    ];

    return (
        <DashboardLayout
            title={bank.name}
            onRefresh={() => { mutate(); mutateStorage(); }}
            actions={
                <div className="flex gap-2 items-center">
                    <span className={`badge ${bank.is_verified ? 'badge-success' : 'badge-warning'}`}>
                        {bank.is_verified ? 'Verified' : 'Unverified'}
                    </span>
                    <span className="badge badge-info">{bank.state.replace(/_/g, ' ')}</span>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="btn-secondary text-sm">Edit Info</button>
                    )}
                </div>
            }
        >
            <div className="dashboard-container">
                <button onClick={() => router.push('/banks')} className="text-gray-500 hover:text-gray-700 text-sm mb-3">
                    ← Back to Banks
                </button>

                <div className="table-card mb-4">
                    <div className="table-card-header">
                        <h2>Overview</h2>
                    </div>
                    <div className="p-4 text-gray-700">
                        <p className="text-sm text-gray-500 mb-1">Email</p>
                        <p className="font-medium text-gray-900">{bank.email}</p>
                    </div>
                </div>

                <div className="tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {isEditing ? (
                            <div className="table-card">
                                <div className="table-card-header">
                                    <h2>Edit Bank Information</h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Bank Name</label>
                                        <input
                                            type="text"
                                            value={editData.name}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            className="glass-input"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Phone</label>
                                            <input
                                                type="text"
                                                value={editData.phone || ''}
                                                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                                className="glass-input"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Website</label>
                                            <input
                                                type="url"
                                                value={editData.website || ''}
                                                onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                                                className="glass-input"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Address</label>
                                        <textarea
                                            value={editData.address || ''}
                                            onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                            className="glass-input"
                                            rows={3}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Description</label>
                                        <textarea
                                            value={editData.description || ''}
                                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                            className="glass-input"
                                            rows={4}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={handleSaveEdit} className="btn-primary">Save Changes</button>
                                        <button onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="table-card">
                                        <div className="table-card-header">
                                            <h2>Basic Information</h2>
                                        </div>
                                        <div className="table-compact">
                                            <table>
                                                <tbody>
                                                    <InfoRow label="Phone" value={bank.phone || 'Not provided'} asRow />
                                                    <InfoRow label="Website" value={bank.website || 'Not provided'} isLink={!!bank.website} asRow />
                                                    <InfoRow label="Address" value={bank.address || 'Not provided'} asRow />
                                                    <InfoRow label="Donors" value={bank.donor_count.toString()} asRow />
                                                    <InfoRow label="Consent Templates" value={bank.consent_template_count.toString()} asRow />
                                                    <InfoRow label="Created" value={new Date(bank.created_at).toLocaleDateString()} asRow />
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="table-card">
                                        <div className="table-card-header">
                                            <h2>Verification & State</h2>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <span className="text-gray-600">Status:</span>
                                                <span className={`font-semibold ${bank.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {bank.is_verified ? 'Verified' : 'Pending Verification'}
                                                </span>
                                            </div>
                                            {bank.verified_at && (
                                                <InfoRow label="Verified On" value={new Date(bank.verified_at).toLocaleDateString()} asRow />
                                            )}
                                            {!bank.is_verified && (
                                                <button onClick={handleVerify} className="btn-primary w-full">Verify Bank</button>
                                            )}
                                            <div className="pt-2">
                                                <label className="block text-sm font-medium mb-2">Change State</label>
                                                <select
                                                    onChange={(e) => handleStateChange(e.target.value)}
                                                    value={bank.state}
                                                    className="glass-input"
                                                >
                                                    <option value="account_created">Account Created</option>
                                                    <option value="verification_pending">Verification Pending</option>
                                                    <option value="verified">Verified</option>
                                                    <option value="subscription_pending">Subscription Pending</option>
                                                    <option value="subscribed_onboarded">Subscribed & Onboarded</option>
                                                    <option value="operational">Operational</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {bank.description && (
                                    <div className="table-card">
                                        <div className="table-card-header">
                                            <h2>Description</h2>
                                        </div>
                                        <div className="p-6 text-gray-700">{bank.description}</div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="table-card">
                        <div className="table-card-header">
                            <h2>Certification Documents</h2>
                        </div>
                        <div className="p-6">
                            {/* Database documents */}
                            {bank.certification_documents && Array.isArray(bank.certification_documents) && bank.certification_documents.length > 0 && (
                                <div className="space-y-3 mb-6">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Database Records</h3>
                                    {bank.certification_documents.map((doc: any, index: number) => (
                                        <div key={`db-${index}`} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{doc.filename || 'Document'}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Status: <span className={`font-semibold ${doc.status === 'verified' ? 'text-green-600' :
                                                            doc.status === 'pending' ? 'text-yellow-600' :
                                                                doc.status === 'rejected' ? 'text-red-600' :
                                                                    'text-gray-600'
                                                            }`}>
                                                            {doc.status || 'Unknown'}
                                                        </span>
                                                    </p>
                                                    {doc.uploaded_at && (
                                                        <p className="text-xs text-gray-500">
                                                            Uploaded: {new Date(doc.uploaded_at).toLocaleString()}
                                                        </p>
                                                    )}
                                                    {doc.reviewed_at && (
                                                        <p className="text-xs text-gray-500">
                                                            Reviewed: {new Date(doc.reviewed_at).toLocaleString()}
                                                        </p>
                                                    )}
                                                    {doc.reviewed_by && (
                                                        <p className="text-xs text-gray-500">
                                                            Reviewed by: {doc.reviewed_by}
                                                        </p>
                                                    )}
                                                    {doc.rejection_reason && (
                                                        <p className="text-xs text-red-600 mt-1">
                                                            Reason: {doc.rejection_reason}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 flex-shrink-0">
                                                    {doc.url && (
                                                        <button
                                                            onClick={() => router.push(`/documents/view?url=${encodeURIComponent(doc.url)}&name=${encodeURIComponent(doc.name || 'Document')}`)}
                                                            className="btn-secondary"
                                                        >
                                                            View
                                                        </button>
                                                    )}
                                                    {doc.status !== 'verified' && (
                                                        <button
                                                            onClick={() => handleVerifyDocument(index)}
                                                            className="btn-success"
                                                        >
                                                            ✓ Verify
                                                        </button>
                                                    )}
                                                    {doc.status !== 'rejected' && (
                                                        <button
                                                            onClick={() => handleRejectDocument(index)}
                                                            className="btn-danger"
                                                        >
                                                            ✗ Reject
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Storage documents */}


                            {/* No documents */}
                            {(!bank.certification_documents || bank.certification_documents.length === 0) &&
                                (!storageDocuments?.documents || storageDocuments.documents.length === 0) && (
                                    <p className="text-gray-500 text-center py-8">No documents uploaded</p>
                                )}
                        </div>
                    </div>
                )}

                {activeTab === 'subscription' && (
                    <SubscriptionTab bank={bank} onUpdate={() => mutate()} />
                )}

                {activeTab === 'donors' && (
                    <div className="table-card">
                        <div className="table-card-header">
                            <h2>Donors</h2>
                        </div>
                        <div className="p-6">
                            <button
                                onClick={() => router.push(`/donors?bank_id=${bankId}`)}
                                className="btn-primary"
                            >
                                View All Donors ({bank.donor_count})
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function SubscriptionTab({ bank, onUpdate }: { bank: BankFullDetail; onUpdate: () => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [subData, setSubData] = useState({
        subscription_tier: bank.subscription_tier || 'Starter',
        subscription_started_at: bank.subscription_started_at || new Date().toISOString().split('T')[0],
        subscription_expires_at: bank.subscription_expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    const handleSave = async () => {
        try {
            await api.createOrUpdateSubscription(bank.id, subData);
            await onUpdate();
            setIsEditing(false);
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Subscription Details</h2>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="btn-secondary">
                        {bank.is_subscribed ? 'Edit Subscription' : 'Add Subscription'}
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Tier</label>
                        <select
                            value={subData.subscription_tier}
                            onChange={(e) => setSubData({ ...subData, subscription_tier: e.target.value })}
                            className="input"
                        >
                            <option value="Starter">Starter - $999/month</option>
                            <option value="Professional">Professional - $2,499/month</option>
                            <option value="Enterprise">Enterprise - $4,999/month</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Start Date</label>
                        <input
                            type="date"
                            value={subData.subscription_started_at}
                            onChange={(e) => setSubData({ ...subData, subscription_started_at: e.target.value })}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Expiry Date</label>
                        <input
                            type="date"
                            value={subData.subscription_expires_at}
                            onChange={(e) => setSubData({ ...subData, subscription_expires_at: e.target.value })}
                            className="input"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleSave} className="btn-primary">
                            Save Subscription
                        </button>
                        <button onClick={() => setIsEditing(false)} className="btn-secondary">
                            Cancel
                        </button>
                    </div>
                </div>
            ) : bank.is_subscribed ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-white/5">
                        <p className="text-gray-400 text-sm">Tier</p>
                        <p className="text-2xl font-bold text-indigo-400">{bank.subscription_tier}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5">
                        <p className="text-gray-400 text-sm">Started</p>
                        <p className="text-lg">
                            {bank.subscription_started_at
                                ? new Date(bank.subscription_started_at).toLocaleDateString()
                                : 'N/A'}
                        </p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5">
                        <p className="text-gray-400 text-sm">Expires</p>
                        <p className="text-lg">
                            {bank.subscription_expires_at
                                ? new Date(bank.subscription_expires_at).toLocaleDateString()
                                : 'N/A'}
                        </p>
                    </div>
                </div>
            ) : (
                <p className="text-gray-400 text-center py-8">No active subscription</p>
            )}
        </div>
    );
}

function InfoRow({ label, value, isLink = false, asRow = false }: { label: string; value: string; isLink?: boolean; asRow?: boolean }) {
    const content = isLink && value !== 'Not provided'
        ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{value}</a>
        : <span className="text-gray-900">{value}</span>;

    if (asRow) {
        return (
            <tr>
                <td className="text-gray-600 font-medium w-1/2 py-2">{label}</td>
                <td className="text-right py-2">{content}</td>
            </tr>
        );
    }

    return (
        <div className="flex justify-between">
            <span className="text-gray-600 font-medium">{label}</span>
            {content}
        </div>
    );
}
