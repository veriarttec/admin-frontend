'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

interface StateHistoryItem {
    id: string;
    from_state: string | null;
    to_state: string;
    changed_by: string | null;
    changed_by_role: string | null;
    reason: string | null;
    created_at: string;
}

interface Document {
    filename: string;
    url: string;
    uploaded_at: string;
    status?: string;
    verified_at?: string;
    verified_by?: string;
    verification_notes?: string;
    rejection_reason?: string;
}

interface ConsentDocument {
    id: string;
    template_id: string;
    template_title: string;
    status: string;
    signed_at: string;
    verified_at?: string;
    verified_by?: string;
    verification_notes?: string;
}

interface TestReport {
    id: string;
    test_type: string;
    test_name: string;
    file_url: string;
    file_name: string;
    uploaded_at: string;
    test_date?: string;
    lab_name?: string;
    notes?: string;
    status?: string;
    reviewed_at?: string;
    reviewed_by?: string;
    review_notes?: string;
}

interface CounselingSession {
    id: string;
    donor_id: string;
    bank_id: string;
    status: string;
    method?: string;
    requested_at?: string;
    scheduled_at?: string;
    completed_at?: string;
    meeting_link?: string;
    location?: string;
    notes?: string;
    report_url?: string;
    report_file_name?: string;
    created_at: string;
}

interface DonorDetail {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    state: string;
    bank_id: string | null;
    bank_name: string | null;
    eligibility_status: string;
    created_at: string;
    address: string | null;
    date_of_birth: string | null;
    donor_type: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    hair_color: string | null;
    skin_color: string | null;
    eye_color: string | null;
    blood_group: string | null;
    medical_interest_info: Record<string, any> | null;
    eligibility_notes: string | null;
    selected_at: string | null;
    consent_pending: boolean;
    counseling_pending: boolean;
    tests_pending: boolean;
    state_history: StateHistoryItem[];
    legal_documents: Document[];
    consents: ConsentDocument[];
    test_reports: TestReport[];
    counseling_sessions: CounselingSession[];
    consent_verified: boolean;
    tests_verified: boolean;
}

export default function DonorDetailPage() {
    const [donor, setDonor] = useState<DonorDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        consent_forms: true,
        test_reports: true,
        counseling_reports: true
    });
    const [editData, setEditData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        address: '',
        date_of_birth: ''
    });
    const router = useRouter();

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };
    const params = useParams();
    const donorId = params.id as string;

    const fetchDonor = async () => {
        try {
            const data = await api.getDonorFullDetails(donorId);
            setDonor(data);
            setEditData({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                phone: data.phone || '',
                email: data.email || '',
                address: data.address || '',
                date_of_birth: data.date_of_birth ? data.date_of_birth.split('T')[0] : ''
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

    useEffect(() => {
        if (donorId) {
            fetchDonor();
        }
    }, [donorId, router]);

    const handleEdit = () => {
        setEditMode(true);
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        if (donor) {
            setEditData({
                first_name: donor.first_name || '',
                last_name: donor.last_name || '',
                phone: donor.phone || '',
                email: donor.email || '',
                address: donor.address || '',
                date_of_birth: donor.date_of_birth ? donor.date_of_birth.split('T')[0] : ''
            });
        }
    };

    const handleSaveEdit = async () => {
        try {
            await api.updateDonorInfo(donorId, editData);
            setEditMode(false);
            await fetchDonor();
            alert('Donor information updated successfully');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update donor');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this donor? This action cannot be undone.')) {
            return;
        }
        try {
            await api.deleteDonor(donorId);
            alert('Donor deleted successfully');
            router.push('/donors');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete donor');
        }
    };

    const handleVerifyDocument = async (docUrl: string) => {
        const notes = prompt('Enter verification notes (optional):');
        try {
            await api.verifyDocument('donor', donorId, docUrl, notes || undefined);
            await fetchDonor();
            alert('Document verified successfully');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to verify document');
        }
    };

    const handleRejectDocument = async (docUrl: string) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;
        try {
            await api.rejectDocument('donor', donorId, docUrl, reason);
            await fetchDonor();
            alert('Document rejected');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to reject document');
        }
    };

    const handleApproveConsent = async () => {
        const notes = prompt('Enter approval notes (optional):');
        try {
            await api.approveConsent(donorId, notes || undefined);
            await fetchDonor();
            alert('Consent approved successfully');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to approve consent');
        }
    };

    const handleRejectConsent = async () => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;
        try {
            await api.rejectConsent(donorId, reason);
            await fetchDonor();
            alert('Consent rejected');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to reject consent');
        }
    };

    const handleApproveTests = async () => {
        const notes = prompt('Enter approval notes (optional):');
        try {
            await api.approveTests(donorId, notes || undefined);
            await fetchDonor();
            alert('Test results approved successfully');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to approve tests');
        }
    };

    const handleRejectTests = async () => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;
        try {
            await api.rejectTests(donorId, reason);
            await fetchDonor();
            alert('Test results rejected');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to reject tests');
        }
    };

    const handleApproveTestReport = async (reportId: string) => {
        const notes = prompt('Enter approval notes (optional):');
        try {
            await api.approveTestReport(donorId, reportId, notes || undefined);
            await fetchDonor();
            alert('Test report approved successfully');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to approve test report');
        }
    };

    const handleRejectTestReport = async (reportId: string) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;
        try {
            await api.rejectTestReport(donorId, reportId, reason);
            await fetchDonor();
            alert('Test report rejected');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to reject test report');
        }
    };

    const viewDocument = (url: string) => {
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-xl text-gray-600">Loading donor details...</div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !donor) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-red-600">{error || 'Donor not found'}</div>
                </div>
            </DashboardLayout>
        );
    }

    const getStateBadgeClass = (state: string) => {
        if (state === 'donor_onboarded') return 'badge-success';
        if (['consent_verified', 'tests_pending', 'eligibility_decision'].includes(state)) return 'badge-info';
        return 'badge-warning';
    };

    const getEligibilityBadgeClass = (status: string) => {
        if (status === 'approved') return 'badge-success';
        if (status === 'rejected') return 'badge-danger';
        return 'badge-warning';
    };

    const getDocumentStatusBadge = (status?: string) => {
        if (status === 'verified') return <span className="badge badge-success">Verified</span>;
        if (status === 'rejected') return <span className="badge badge-danger">Rejected</span>;
        return <span className="badge badge-warning">Pending</span>;
    };

    const fullName = donor.first_name && donor.last_name
        ? `${donor.first_name} ${donor.last_name}`
        : 'Unknown Donor';

    return (
        <DashboardLayout title={fullName} onRefresh={fetchDonor}>
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <header className="mb-8 flex justify-between items-start">
                        <div>
                            <button onClick={() => router.push('/donors')} className="text-blue-600 hover:text-blue-700 mb-2 text-sm">
                                ← Back to Donors
                            </button>
                            <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
                            <p className="text-gray-600 mt-1">{donor.email || 'No email'}</p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="flex flex-col gap-2">
                                <span className={`badge ${getStateBadgeClass(donor.state)}`}>
                                    {donor.state.replace('_', ' ')}
                                </span>
                                <span className={`badge ${getEligibilityBadgeClass(donor.eligibility_status)}`}>
                                    {donor.eligibility_status}
                                </span>
                            </div>
                            {!editMode && (
                                <div className="flex gap-2">
                                    <button onClick={handleEdit} className="btn-primary">
                                        Edit Info
                                    </button>
                                    <button onClick={handleDelete} className="btn-danger">
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Personal Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Personal Information Card */}
                            <div className="table-card">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                                        {editMode && (
                                            <div className="flex gap-2">
                                                <button onClick={handleSaveEdit} className="btn-primary">Save</button>
                                                <button onClick={handleCancelEdit} className="btn-secondary">Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                            {editMode ? (
                                                <input
                                                    type="text"
                                                    value={editData.first_name}
                                                    onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                                                    className="glass-input w-full"
                                                />
                                            ) : (
                                                <p className="text-gray-900">{donor.first_name || 'N/A'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                            {editMode ? (
                                                <input
                                                    type="text"
                                                    value={editData.last_name}
                                                    onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                                                    className="glass-input w-full"
                                                />
                                            ) : (
                                                <p className="text-gray-900">{donor.last_name || 'N/A'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            {editMode ? (
                                                <input
                                                    type="email"
                                                    value={editData.email}
                                                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                                    className="glass-input w-full"
                                                />
                                            ) : (
                                                <p className="text-gray-900">{donor.email || 'N/A'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                            {editMode ? (
                                                <input
                                                    type="tel"
                                                    value={editData.phone}
                                                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                                    className="glass-input w-full"
                                                />
                                            ) : (
                                                <p className="text-gray-900">{donor.phone || 'N/A'}</p>
                                            )}
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                            {editMode ? (
                                                <textarea
                                                    value={editData.address}
                                                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                                    className="glass-input w-full"
                                                    rows={2}
                                                />
                                            ) : (
                                                <p className="text-gray-900">{donor.address || 'N/A'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                            {editMode ? (
                                                <input
                                                    type="date"
                                                    value={editData.date_of_birth}
                                                    onChange={(e) => setEditData({ ...editData, date_of_birth: e.target.value })}
                                                    className="glass-input w-full"
                                                />
                                            ) : (
                                                <p className="text-gray-900">
                                                    {donor.date_of_birth ? new Date(donor.date_of_birth).toLocaleDateString() : 'N/A'}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                                            <p className="text-gray-900">{donor.bank_name || 'No bank selected'}</p>
                                        </div>
                                    </div>

                                    {/* Physical Characteristics */}
                                    {(donor.donor_type || donor.height_cm || donor.blood_group) && (
                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Physical Characteristics</h3>
                                            <div className="grid grid-cols-3 gap-4">
                                                {donor.donor_type && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Donor Type</label>
                                                        <p className="text-gray-900">{donor.donor_type}</p>
                                                    </div>
                                                )}
                                                {donor.height_cm && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                                                        <p className="text-gray-900">{donor.height_cm} cm</p>
                                                    </div>
                                                )}
                                                {donor.weight_kg && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                                                        <p className="text-gray-900">{donor.weight_kg} kg</p>
                                                    </div>
                                                )}
                                                {donor.blood_group && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                                                        <p className="text-gray-900">{donor.blood_group}</p>
                                                    </div>
                                                )}
                                                {donor.hair_color && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hair Color</label>
                                                        <p className="text-gray-900">{donor.hair_color}</p>
                                                    </div>
                                                )}
                                                {donor.eye_color && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Eye Color</label>
                                                        <p className="text-gray-900">{donor.eye_color}</p>
                                                    </div>
                                                )}
                                                {donor.skin_color && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Skin Tone</label>
                                                        <p className="text-gray-900">{donor.skin_color}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Legal Documents */}
                            <div className="table-card">
                                <div className="p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Legal Documents</h2>

                                    {(() => {
                                        // Robust handling of legal_documents (Array vs Dict)
                                        let docs: Document[] = [];
                                        if (Array.isArray(donor.legal_documents)) {
                                            docs = donor.legal_documents;
                                        } else if (donor.legal_documents && typeof donor.legal_documents === 'object') {
                                            // @ts-ignore
                                            docs = donor.legal_documents.documents || [];
                                        }

                                        if (docs.length === 0) {
                                            return <p className="text-gray-500 italic">No documents uploaded.</p>;
                                        }

                                        return (
                                            <div className="space-y-3">
                                                {/* Documents from database */}
                                                {docs.map((doc, index) => (
                                                    <div key={`db-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900">{doc.filename || doc.url?.split('/').pop() || 'Document'}</p>
                                                            <p className="text-sm text-gray-600">
                                                                Uploaded: {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'N/A'}
                                                            </p>
                                                            {doc.verified_by && (
                                                                <p className="text-sm text-gray-600">
                                                                    Verified by: {doc.verified_by} on {doc.verified_at ? new Date(doc.verified_at).toLocaleDateString() : ''}
                                                                </p>
                                                            )}
                                                            {doc.rejection_reason && (
                                                                <p className="text-sm text-red-600">
                                                                    Rejected: {doc.rejection_reason}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {getDocumentStatusBadge(doc.status)}
                                                            <button
                                                                onClick={() => viewDocument(doc.url)}
                                                                className="btn-secondary"
                                                            >
                                                                View
                                                            </button>
                                                            {doc.status !== 'verified' && doc.status !== 'rejected' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleVerifyDocument(doc.url)}
                                                                        className="btn-primary"
                                                                    >
                                                                        Verify
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleRejectDocument(doc.url)}
                                                                        className="btn-danger"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>



                            {/* Consent Forms */}
                            {donor.consents && donor.consents.length > 0 && (
                                <div className="table-card">
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-xl font-semibold text-gray-900">Consent Forms</h2>
                                            {donor.consent_pending && (
                                                <div className="flex gap-2">
                                                    <button onClick={handleApproveConsent} className="btn-primary">
                                                        Approve All
                                                    </button>
                                                    <button onClick={handleRejectConsent} className="btn-danger">
                                                        Reject All
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-3">
                                            {donor.consents.map((consent) => (
                                                <div key={consent.id} className="p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{consent.template_title}</p>
                                                            <p className="text-sm text-gray-600">
                                                                Signed: {new Date(consent.signed_at).toLocaleDateString()}
                                                            </p>
                                                            {consent.verified_by && (
                                                                <p className="text-sm text-gray-600">
                                                                    Verified by: {consent.verified_by}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className={`badge ${consent.status === 'verified' ? 'badge-success' : consent.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                                                            {consent.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Test Reports - REMOVED PER USER REQUEST */}\n {/* ADMIN SHOULD NOT SEE TEST RESULTS */}

                            {/* Counseling Sessions */}
                            {donor.counseling_sessions && donor.counseling_sessions.length > 0 && (
                                <div className="table-card">
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-xl font-semibold text-gray-900">Counseling Sessions</h2>
                                                <span className="text-xs bg-indigo-500 text-white px-3 py-1 rounded-full font-medium">
                                                    {donor.counseling_sessions.length} session{donor.counseling_sessions.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {donor.counseling_sessions.map((session) => (
                                                <div key={session.id} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-indigo-600">💬</span>
                                                            <p className="font-medium text-gray-900 text-sm">
                                                                {session.method === 'video' ? 'Video Call' : session.method === 'in_person' ? 'In-Person' : session.method || 'Counseling Session'}
                                                            </p>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${session.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                                                    session.status === 'requested' ? 'bg-yellow-100 text-yellow-700' :
                                                                        'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                {session.status}
                                                            </span>
                                                        </div>
                                                        <div className="ml-6 mt-1 space-y-0.5">
                                                            {session.scheduled_at && (
                                                                <p className="text-xs text-gray-600">
                                                                    Scheduled: {new Date(session.scheduled_at).toLocaleDateString('en-US', {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </p>
                                                            )}
                                                            {session.completed_at && (
                                                                <p className="text-xs text-gray-600">
                                                                    Completed: {new Date(session.completed_at).toLocaleDateString()}
                                                                </p>
                                                            )}
                                                            {session.notes && (
                                                                <p className="text-xs text-gray-600">Notes: {session.notes}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {session.report_url && (
                                                            <button
                                                                onClick={() => viewDocument(session.report_url!)}
                                                                className="btn-secondary text-sm px-3 py-1"
                                                            >
                                                                View Report
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Status & History */}
                        <div className="space-y-6">
                            {/* Status Summary */}
                            <div className="table-card">
                                <div className="p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Status Summary</h2>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Consent Status</span>
                                            <span className={`badge ${donor.consent_pending ? 'badge-warning' : 'badge-success'}`}>
                                                {donor.consent_pending ? 'Pending' : 'Verified'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Counseling Status</span>
                                            <span className={`badge ${donor.counseling_pending ? 'badge-warning' : 'badge-success'}`}>
                                                {donor.counseling_pending ? 'Pending' : 'Completed'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Tests Status</span>
                                            <span className={`badge ${donor.tests_pending ? 'badge-warning' : 'badge-success'}`}>
                                                {donor.tests_pending ? 'Pending' : 'Verified'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* State History */}
                            <div className="table-card">
                                <div className="p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">State History</h2>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {donor.state_history.map((history) => (
                                            <div key={history.id} className="border-l-4 border-blue-500 pl-4 py-2">
                                                <p className="font-medium text-gray-900">
                                                    {history.from_state ? `${history.from_state} → ` : ''}
                                                    {history.to_state}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {new Date(history.created_at).toLocaleString()}
                                                </p>
                                                {history.changed_by && (
                                                    <p className="text-sm text-gray-600">
                                                        By: {history.changed_by} ({history.changed_by_role})
                                                    </p>
                                                )}
                                                {history.reason && (
                                                    <p className="text-sm text-gray-600 italic">
                                                        Reason: {history.reason}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout >
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between text-sm">
            <span className="text-gray-600">{label}</span>
            <span className="text-gray-900 font-medium">{value}</span>
        </div>
    );
}
