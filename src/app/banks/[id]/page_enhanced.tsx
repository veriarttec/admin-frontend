'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';

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

export default function BankDetailPageEnhanced() {
    const [bank, setBank] = useState<BankFullDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [activeTab, setActiveTab] = useState('overview');
    const router = useRouter();
    const params = useParams();
    const bankId = params.id as string;

    useEffect(() => {
        fetchBank();
    }, [bankId]);

    const fetchBank = async () => {
        try {
            const data = await api.getBankFullDetails(bankId);
            setBank(data);
            setEditData({
                name: data.name,
                phone: data.phone,
                address: data.address,
                website: data.website,
                description: data.description,
            });
        } catch (err) {
            if (err instanceof Error && err.message.includes('401')) {
                router.push('/login');
            } else {
                setError(err instanceof Error ? err.message : 'Failed to load bank');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        try {
            await api.updateBank(bankId, editData);
            await fetchBank();
            setIsEditing(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update bank');
        }
    };

    const handleVerify = async () => {
        if (!confirm('Are you sure you want to verify this bank?')) return;
        try {
            await api.verifyBank(bankId, 'admin', 'Verified via admin portal');
            await fetchBank();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to verify bank');
        }
    };

    const handleStateChange = async (newState: string) => {
        const reason = prompt('Enter reason for state change:');
        if (!reason) return;
        try {
            await api.changeBankState(bankId, newState, reason);
            await fetchBank();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to change state');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl text-gray-400">Loading bank details...</div>
            </div>
        );
    }

    if (error || !bank) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-400">{error || 'Bank not found'}</div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'documents', label: 'Documents' },
        { id: 'subscription', label: 'Subscription' },
        { id: 'donors', label: `Donors (${bank.donor_count})` },
    ];

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <button onClick={() => router.push('/banks')} className="text-gray-400 hover:text-white mb-2">
                        ← Back to Banks
                    </button>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold">{bank.name}</h1>
                            <p className="text-gray-400 mt-1">{bank.email}</p>
                        </div>
                        <div className="flex gap-2">
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="btn-secondary">
                                    Edit Info
                                </button>
                            )}
                            <span className={`badge ${bank.is_verified ? 'badge-success' : 'badge-warning'}`}>
                                {bank.is_verified ? 'Verified' : 'Unverified'}
                            </span>
                            <span className={`badge badge-info`}>
                                {bank.state.replace(/_/g, ' ')}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-700">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 px-4 font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'border-b-2 border-indigo-500 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {isEditing ? (
                            <div className="glass-card p-6">
                                <h2 className="text-xl font-semibold mb-4">Edit Bank Information</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Bank Name</label>
                                        <input
                                            type="text"
                                            value={editData.name}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Phone</label>
                                        <input
                                            type="text"
                                            value={editData.phone || ''}
                                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Website</label>
                                        <input
                                            type="url"
                                            value={editData.website || ''}
                                            onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Address</label>
                                        <textarea
                                            value={editData.address || ''}
                                            onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                            className="input"
                                            rows={3}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Description</label>
                                        <textarea
                                            value={editData.description || ''}
                                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                            className="input"
                                            rows={4}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={handleSaveEdit} className="btn-primary">
                                            Save Changes
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="btn-secondary">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="glass-card p-6">
                                        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                                        <div className="space-y-3">
                                            <InfoRow label="Phone" value={bank.phone || 'Not provided'} />
                                            <InfoRow label="Website" value={bank.website || 'Not provided'} isLink={!!bank.website} />
                                            <InfoRow label="Address" value={bank.address || 'Not provided'} />
                                            <InfoRow label="Donors" value={bank.donor_count.toString()} />
                                            <InfoRow label="Consent Templates" value={bank.consent_template_count.toString()} />
                                            <InfoRow label="Created" value={new Date(bank.created_at).toLocaleDateString()} />
                                        </div>
                                    </div>

                                    <div className="glass-card p-6">
                                        <h2 className="text-xl font-semibold mb-4">Verification & State</h2>
                                        <div className="space-y-4">
                                            <div>
                                                <span className="text-gray-400">Status:</span>
                                                <span className={`ml-2 font-semibold ${bank.is_verified ? 'text-green-400' : 'text-yellow-400'}`}>
                                                    {bank.is_verified ? 'Verified' : 'Pending Verification'}
                                                </span>
                                            </div>
                                            {bank.verified_at && (
                                                <InfoRow label="Verified On" value={new Date(bank.verified_at).toLocaleDateString()} />
                                            )}
                                            {!bank.is_verified && (
                                                <button onClick={handleVerify} className="btn-primary w-full">
                                                    Verify Bank
                                                </button>
                                            )}
                                            <div className="mt-4 pt-4 border-t border-gray-700">
                                                <label className="block text-sm font-medium mb-2">Change State</label>
                                                <select
                                                    onChange={(e) => handleStateChange(e.target.value)}
                                                    value={bank.state}
                                                    className="input"
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
                                    <div className="glass-card p-6">
                                        <h2 className="text-xl font-semibold mb-4">Description</h2>
                                        <p className="text-gray-300">{bank.description}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-semibold mb-4">Certification Documents</h2>
                        {bank.certification_documents && Object.keys(bank.certification_documents).length > 0 ? (
                            <div className="space-y-3">
                                {Object.entries(bank.certification_documents).map(([key, value]: [string, any]) => (
                                    <div key={key} className="p-4 bg-white/5 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">{key}</p>
                                            <p className="text-sm text-gray-400">{typeof value === 'string' ? value : JSON.stringify(value)}</p>
                                        </div>
                                        {typeof value === 'string' && value.startsWith('http') && (
                                            <a href={value} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                                                View
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-8">No documents uploaded</p>
                        )}
                    </div>
                )}

                {activeTab === 'subscription' && (
                    <SubscriptionTab bank={bank} onUpdate={fetchBank} />
                )}

                {activeTab === 'donors' && (
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-semibold mb-4">Donors</h2>
                        <button
                            onClick={() => router.push(`/donors?bank_id=${bankId}`)}
                            className="btn-primary"
                        >
                            View All Donors ({bank.donor_count})
                        </button>
                    </div>
                )}
            </div>
        </div>
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
            alert(err instanceof Error ? err.message : 'Failed to update subscription');
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

function InfoRow({ label, value, isLink = false }: { label: string; value: string; isLink?: boolean }) {
    return (
        <div className="flex justify-between">
            <span className="text-gray-400">{label}</span>
            {isLink && value !== 'Not provided' ? (
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                    {value}
                </a>
            ) : (
                <span>{value}</span>
            )}
        </div>
    );
}
