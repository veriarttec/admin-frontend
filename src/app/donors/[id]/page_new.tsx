'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';

interface DonorFullDetail {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    state: string;
    date_of_birth: string | null;
    address: string | null;
    medical_interest_info: any;
    legal_documents: any;
    bank_id: string | null;
    bank_name: string | null;
    selected_at: string | null;
    consent_pending: boolean;
    counseling_pending: boolean;
    tests_pending: boolean;
    eligibility_status: string;
    eligibility_notes: string | null;
    eligibility_decided_at: string | null;
    created_at: string;
    updated_at: string | null;
    state_history: any[];
    consents: any[];
    counseling_sessions: any[];
    test_reports: any[];
}

export default function DonorDetailPage() {
    const [donor, setDonor] = useState<DonorFullDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [activeTab, setActiveTab] = useState('overview');
    const router = useRouter();
    const params = useParams();
    const donorId = params.id as string;

    useEffect(() => {
        fetchDonor();
    }, [donorId]);

    const fetchDonor = async () => {
        try {
            const data = await api.getDonorFullDetails(donorId);
            setDonor(data);
            setEditData({
                first_name: data.first_name,
                last_name: data.last_name,
                phone: data.phone,
                email: data.email,
                address: data.address,
                date_of_birth: data.date_of_birth ? data.date_of_birth.split('T')[0] : '',
            });
        } catch (err) {
            if (err instanceof Error && err.message.includes('401')) {
                router.push('/login');
            } else {
                setError(err instanceof Error ? err.message : 'Failed to load donor');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        try {
            await api.updateDonor(donorId, editData);
            await fetchDonor();
            setIsEditing(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update donor');
        }
    };

    const handleUpdateEligibility = async () => {
        const status = prompt('Enter eligibility status (pending/approved/rejected):');
        if (!status) return;
        const notes = prompt('Enter notes (optional):');
        try {
            await api.updateDonorEligibility(donorId, status, notes || '');
            await fetchDonor();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update eligibility');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl text-gray-400">Loading donor details...</div>
            </div>
        );
    }

    if (error || !donor) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-400">{error || 'Donor not found'}</div>
            </div>
        );
    }

    const fullName = donor.first_name && donor.last_name
        ? `${donor.first_name} ${donor.last_name}`
        : 'Unknown Donor';

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'documents', label: 'Documents & Medical Info' },
        { id: 'test-reports', label: `Test Reports (${donor.test_reports?.length || 0})` },
        { id: 'consents', label: `Consents (${donor.consents?.length || 0})` },
        { id: 'counseling', label: `Counseling (${donor.counseling_sessions?.length || 0})` },
        { id: 'history', label: `History (${donor.state_history?.length || 0})` },
    ];

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <button onClick={() => router.push('/donors')} className="text-gray-400 hover:text-white mb-2">
                        ← Back to Donors
                    </button>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold">{fullName}</h1>
                            <p className="text-gray-400 mt-1">{donor.email || 'No email'}</p>
                        </div>
                        <div className="flex gap-2">
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="btn-secondary">
                                    Edit Info
                                </button>
                            )}
                            <span className={`badge ${donor.state === 'donor_onboarded' ? 'badge-success' : 'badge-warning'}`}>
                                {donor.state.replace(/_/g, ' ')}
                            </span>
                            <span className={`badge ${donor.eligibility_status === 'approved' ? 'badge-success' : donor.eligibility_status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                                {donor.eligibility_status}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-700 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
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
                                <h2 className="text-xl font-semibold mb-4">Edit Donor Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">First Name</label>
                                        <input
                                            type="text"
                                            value={editData.first_name || ''}
                                            onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            value={editData.last_name || ''}
                                            onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={editData.email || ''}
                                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
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
                                        <label className="block text-sm font-medium mb-2">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={editData.date_of_birth || ''}
                                            onChange={(e) => setEditData({ ...editData, date_of_birth: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-2">Address</label>
                                        <textarea
                                            value={editData.address || ''}
                                            onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                            className="input"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button onClick={handleSaveEdit} className="btn-primary">
                                        Save Changes
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className="btn-secondary">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="glass-card p-6">
                                        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                                        <div className="space-y-3">
                                            <InfoRow label="Phone" value={donor.phone || 'Not provided'} />
                                            <InfoRow label="Date of Birth" value={donor.date_of_birth ? new Date(donor.date_of_birth).toLocaleDateString() : 'Not provided'} />
                                            <InfoRow label="Address" value={donor.address || 'Not provided'} />
                                            <InfoRow label="Created" value={new Date(donor.created_at).toLocaleDateString()} />
                                        </div>
                                    </div>

                                    <div className="glass-card p-6">
                                        <h2 className="text-xl font-semibold mb-4">Bank & Status</h2>
                                        <div className="space-y-3">
                                            <InfoRow label="Bank" value={donor.bank_name || 'No bank assigned'} />
                                            <InfoRow label="Selected At" value={donor.selected_at ? new Date(donor.selected_at).toLocaleDateString() : 'N/A'} />
                                            <div className="pt-3 border-t border-gray-700">
                                                <p className="text-gray-400 text-sm mb-2">Pending Actions</p>
                                                <div className="flex gap-2 flex-wrap">
                                                    {donor.consent_pending && <span className="badge badge-warning">Consent</span>}
                                                    {donor.counseling_pending && <span className="badge badge-warning">Counseling</span>}
                                                    {donor.tests_pending && <span className="badge badge-warning">Tests</span>}
                                                    {!donor.consent_pending && !donor.counseling_pending && !donor.tests_pending && (
                                                        <span className="text-gray-500">None</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-card p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-semibold">Eligibility</h2>
                                        <button onClick={handleUpdateEligibility} className="btn-secondary">
                                            Update Eligibility
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-4 h-4 rounded-full ${donor.eligibility_status === 'approved' ? 'bg-green-500' :
                                                donor.eligibility_status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                                            }`} />
                                        <span className="text-lg capitalize">{donor.eligibility_status}</span>
                                    </div>
                                    {donor.eligibility_notes && (
                                        <div className="p-4 rounded-lg bg-white/5">
                                            <p className="text-gray-400 text-sm mb-1">Notes</p>
                                            <p>{donor.eligibility_notes}</p>
                                        </div>
                                    )}
                                    {donor.eligibility_decided_at && (
                                        <p className="text-sm text-gray-400 mt-2">
                                            Decided: {new Date(donor.eligibility_decided_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-semibold mb-4">Legal Documents</h2>
                            {donor.legal_documents && Object.keys(donor.legal_documents).length > 0 ? (
                                <div className="space-y-3">
                                    {Object.entries(donor.legal_documents).map(([key, value]: [string, any]) => (
                                        <div key={key} className="p-4 bg-white/5 rounded-lg">
                                            <p className="font-medium">{key}</p>
                                            <p className="text-sm text-gray-400">{typeof value === 'string' ? value : JSON.stringify(value)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-center py-8">No documents uploaded</p>
                            )}
                        </div>

                        <div className="glass-card p-6">
                            <h2 className="text-xl font-semibold mb-4">Medical Interest Information</h2>
                            {donor.medical_interest_info && Object.keys(donor.medical_interest_info).length > 0 ? (
                                <div className="space-y-2">
                                    {Object.entries(donor.medical_interest_info).map(([key, value]) => (
                                        <InfoRow key={key} label={key.replace(/_/g, ' ')} value={String(value)} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-center py-8">No medical information available</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'test-reports' && (
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-semibold mb-4">Test Reports</h2>
                        {donor.test_reports && donor.test_reports.length > 0 ? (
                            <div className="space-y-4">
                                {donor.test_reports.map((report: any) => (
                                    <div key={report.id} className="p-4 bg-white/5 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold text-lg">{report.test_name}</h3>
                                                <p className="text-sm text-gray-400">{report.test_type}</p>
                                            </div>
                                            <span className="badge badge-info">{report.source}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                            {report.lab_name && <p><span className="text-gray-400">Lab:</span> {report.lab_name}</p>}
                                            {report.test_date && <p><span className="text-gray-400">Date:</span> {new Date(report.test_date).toLocaleDateString()}</p>}
                                            <p><span className="text-gray-400">Uploaded:</span> {new Date(report.uploaded_at).toLocaleDateString()}</p>
                                        </div>
                                        {report.notes && <p className="mt-2 text-sm text-gray-300">{report.notes}</p>}
                                        {report.file_url && (
                                            <a href={report.file_url} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-3 inline-block">
                                                View Report
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-8">No test reports available</p>
                        )}
                    </div>
                )}

                {activeTab === 'consents' && (
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-semibold mb-4">Consent Forms</h2>
                        {donor.consents && donor.consents.length > 0 ? (
                            <div className="space-y-4">
                                {donor.consents.map((consent: any) => (
                                    <div key={consent.id} className="p-4 bg-white/5 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold">{consent.template_title || 'Consent Form'}</h3>
                                            <span className={`badge ${consent.status === 'verified' ? 'badge-success' :
                                                    consent.status === 'signed' ? 'badge-info' :
                                                        consent.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                                                }`}>
                                                {consent.status}
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-sm text-gray-400">
                                            {consent.signed_at && <p>Signed: {new Date(consent.signed_at).toLocaleString()}</p>}
                                            {consent.verified_at && <p>Verified: {new Date(consent.verified_at).toLocaleString()}</p>}
                                            {consent.verification_notes && (
                                                <div className="mt-2 p-2 bg-white/5 rounded">
                                                    <p className="text-xs text-gray-500">Verification Notes:</p>
                                                    <p className="text-gray-300">{consent.verification_notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-8">No consent forms available</p>
                        )}
                    </div>
                )}

                {activeTab === 'counseling' && (
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-semibold mb-4">Counseling Sessions</h2>
                        {donor.counseling_sessions && donor.counseling_sessions.length > 0 ? (
                            <div className="space-y-4">
                                {donor.counseling_sessions.map((session: any) => (
                                    <div key={session.id} className="p-4 bg-white/5 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold">Counseling Session</h3>
                                                <p className="text-sm text-gray-400">{session.method && `Method: ${session.method}`}</p>
                                            </div>
                                            <span className={`badge ${session.status === 'completed' ? 'badge-success' :
                                                    session.status === 'scheduled' ? 'badge-info' :
                                                        session.status === 'cancelled' ? 'badge-danger' : 'badge-warning'
                                                }`}>
                                                {session.status}
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <p><span className="text-gray-400">Requested:</span> {new Date(session.requested_at).toLocaleDateString()}</p>
                                            {session.scheduled_at && <p><span className="text-gray-400">Scheduled:</span> {new Date(session.scheduled_at).toLocaleDateString()}</p>}
                                            {session.completed_at && <p><span className="text-gray-400">Completed:</span> {new Date(session.completed_at).toLocaleDateString()}</p>}
                                            {session.location && <p><span className="text-gray-400">Location:</span> {session.location}</p>}
                                            {session.meeting_link && (
                                                <p><span className="text-gray-400">Link:</span> <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{session.meeting_link}</a></p>
                                            )}
                                            {session.notes && (
                                                <div className="mt-2 p-2 bg-white/5 rounded">
                                                    <p className="text-xs text-gray-500">Notes:</p>
                                                    <p className="text-gray-300">{session.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-8">No counseling sessions available</p>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-semibold mb-4">State History</h2>
                        {donor.state_history && donor.state_history.length > 0 ? (
                            <div className="space-y-4">
                                {donor.state_history.map((item: any, index: number) => (
                                    <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg bg-white/5">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm">
                                            {donor.state_history.length - index}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {item.from_state && (
                                                    <>
                                                        <span className="text-gray-400">{item.from_state.replace(/_/g, ' ')}</span>
                                                        <span className="text-indigo-400">→</span>
                                                    </>
                                                )}
                                                <span className="font-semibold">{item.to_state.replace(/_/g, ' ')}</span>
                                            </div>
                                            <p className="text-sm text-gray-400">
                                                {new Date(item.created_at).toLocaleString()}
                                            </p>
                                            {item.changed_by_role && (
                                                <p className="text-sm text-gray-500">Changed by: {item.changed_by_role}</p>
                                            )}
                                            {item.reason && (
                                                <p className="text-sm text-gray-300 mt-1">{item.reason}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-8">No state history available</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-gray-400 capitalize">{label}</span>
            <span>{value}</span>
        </div>
    );
}
