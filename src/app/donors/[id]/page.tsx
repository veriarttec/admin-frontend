'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import useSWR from 'swr';
import api, { getApiErrorMessage } from '@/lib/api';
import { useConfirm } from '@/components/ConfirmDialog';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Pencil, Trash2, FileText, Eye } from 'lucide-react';

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

interface LegalDocument {
    id: string;
    type: string;
    status: string;
    file_url: string;
    file_name: string;
    rejection_reason?: string | null;
    uploaded_at?: string;
    verified_at?: string;
    verified_by?: string;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
    government_id: 'Government ID',
    proof_of_address: 'Proof of Address',
    marriage_certificate: 'Marriage Certificate',
    children_birth_certificate: "Children's Birth Certificate",
    other: 'Other',
};

function documentTypeLabel(type: string): string {
    return DOCUMENT_TYPE_LABELS[type] || type.replace(/_/g, ' ');
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
    profile_picture_url: string | null;
    donor_type: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    hair_color: string | null;
    skin_color: string | null;
    eye_color: string | null;
    blood_group: string | null;
    medical_interest_info: Record<string, any> | null;
    aadhaar_number: string | null;
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
    const confirm = useConfirm();
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
    const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
    const [showProfilePicture, setShowProfilePicture] = useState(false);
    const params = useParams();
    const donorId = params.id as string;

    const { data: donor, isLoading, error, mutate } = useSWR<DonorDetail>(
        donorId ? ['donor', donorId] : null,
        () => api.getDonorFullDetails(donorId),
        {
            onSuccess: (data) => {
                setEditData({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    address: data.address || '',
                    date_of_birth: data.date_of_birth ? data.date_of_birth.split('T')[0] : ''
                });
            },
            onError: (err) => {
                if (err instanceof Error && err.message.includes('401')) {
                    router.push('/login');
                }
            },
        }
    );

    const { data: legalDocuments, mutate: mutateDocuments } = useSWR<LegalDocument[]>(
        donorId ? ['donor-documents', donorId] : null,
        () => api.getDonorDocuments(donorId),
    );

    useEffect(() => {
        if (!showProfilePicture) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowProfilePicture(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showProfilePicture]);

    const handleViewProfilePicture = async () => {
        if (!donor?.profile_picture_url) return;
        try {
            const { url } = await api.getSignedDocumentUrlFromStoredUrl(donor.profile_picture_url);
            setProfilePictureUrl(url);
            setShowProfilePicture(true);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to load profile picture'));
        }
    };

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
            mutate();
            toast.success('Donor information updated successfully');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleDelete = async () => {
        if (!(await confirm({
            title: 'Delete donor?',
            description: 'This action cannot be undone.',
            destructive: true,
            confirmLabel: 'Delete donor',
        }))) return;
        try {
            await api.deleteDonor(donorId);
            toast.success('Donor deleted successfully');
            router.push('/donors');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleVerifyDocument = async (docUrl: string) => {
        const notes = await confirm({
            title: 'Verify document',
            input: { label: 'Verification notes (optional)', required: false },
        }) as string | null;
        if (notes === null) return;
        try {
            await api.verifyDocument('donor', donorId, docUrl, notes || undefined);
            mutate();
            mutateDocuments();
            toast.success('Document verified successfully');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleRejectDocument = async (docUrl: string) => {
        const reason = await confirm({
            title: 'Reject document',
            destructive: true,
            input: { label: 'Rejection reason', required: true, multiline: true },
        }) as string | null;
        if (reason === null) return;
        try {
            await api.rejectDocument('donor', donorId, docUrl, reason);
            mutate();
            mutateDocuments();
            toast.success('Document rejected');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleRequestReupload = async (doc: LegalDocument) => {
        const reason = await confirm({
            title: 'Request re-upload',
            description: `The donor will be asked to re-upload their ${documentTypeLabel(doc.type)}.`,
            input: { label: 'Reason', required: true, multiline: true },
        }) as string | null;
        if (reason === null) return;
        try {
            await api.requestDocumentReupload(donorId, doc.id, reason);
            mutateDocuments();
            mutate();
            toast.success('Re-upload requested');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleDeleteDocument = async (doc: LegalDocument) => {
        if (!(await confirm({
            title: 'Delete document?',
            description: `This permanently deletes the file from storage. This cannot be undone.`,
            destructive: true,
            confirmLabel: 'Delete document',
        }))) return;
        try {
            await api.deleteDonorDocument(donorId, doc.id);
            mutateDocuments();
            mutate();
            toast.success('Document deleted');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleApproveConsent = async () => {
        const notes = await confirm({
            title: 'Approve consent',
            input: { label: 'Approval notes (optional)', required: false },
        }) as string | null;
        if (notes === null) return;
        try {
            await api.approveConsent(donorId, notes || undefined);
            mutate();
            toast.success('Consent approved successfully');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleRejectConsent = async () => {
        const reason = await confirm({
            title: 'Reject consent',
            destructive: true,
            input: { label: 'Rejection reason', required: true, multiline: true },
        }) as string | null;
        if (reason === null) return;
        try {
            await api.rejectConsent(donorId, reason);
            mutate();
            toast.success('Consent rejected');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleApproveTests = async () => {
        const notes = await confirm({
            title: 'Approve test results',
            input: { label: 'Approval notes (optional)', required: false },
        }) as string | null;
        if (notes === null) return;
        try {
            await api.approveTests(donorId, notes || undefined);
            mutate();
            toast.success('Test results approved successfully');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleRejectTests = async () => {
        const reason = await confirm({
            title: 'Reject test results',
            destructive: true,
            input: { label: 'Rejection reason', required: true, multiline: true },
        }) as string | null;
        if (reason === null) return;
        try {
            await api.rejectTests(donorId, reason);
            mutate();
            toast.success('Test results rejected');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleApproveTestReport = async (reportId: string) => {
        const notes = await confirm({
            title: 'Approve test report',
            input: { label: 'Approval notes (optional)', required: false },
        }) as string | null;
        if (notes === null) return;
        try {
            await api.approveTestReport(donorId, reportId, notes || undefined);
            mutate();
            toast.success('Test report approved successfully');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleRejectTestReport = async (reportId: string) => {
        const reason = await confirm({
            title: 'Reject test report',
            destructive: true,
            input: { label: 'Rejection reason', required: true, multiline: true },
        }) as string | null;
        if (reason === null) return;
        try {
            await api.rejectTestReport(donorId, reportId, reason);
            mutate();
            toast.success('Test report rejected');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const viewDocument = (url: string) => {
        const name = decodeURIComponent(url.split('?')[0].split('/').pop() || 'Document');
        router.push(`/documents/view?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`);
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-xl text-muted-foreground">Loading donor details...</div>
                </div>
            </DashboardLayout>
        );
    }

    const errorMessage = error ? getApiErrorMessage(error, 'Failed to load donor') : '';

    if (errorMessage || !donor) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-red-600">{errorMessage || 'Donor not found'}</div>
                </div>
            </DashboardLayout>
        );
    }


    const fullName = donor.first_name && donor.last_name
        ? `${donor.first_name} ${donor.last_name}`
        : 'Unknown Donor';

    return (
        <DashboardLayout title={fullName} onRefresh={() => mutate()}>
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <header className="mb-8 flex justify-between items-start">
                        <div className="flex items-start gap-4">
                            <button
                                onClick={donor.profile_picture_url ? handleViewProfilePicture : undefined}
                                disabled={!donor.profile_picture_url}
                                className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-xl font-semibold text-white bg-gray-400 mt-1"
                                title={donor.profile_picture_url ? 'View profile picture' : undefined}
                                style={{ cursor: donor.profile_picture_url ? 'pointer' : 'default' }}
                            >
                                {donor.profile_picture_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={donor.profile_picture_url} alt={fullName} className="w-full h-full object-cover" />
                                ) : (
                                    <span>
                                        {(donor.first_name?.[0] || '') + (donor.last_name?.[0] || '') || '?'}
                                    </span>
                                )}
                            </button>
                            <div>
                                <Link href="/donors" className="text-secondary hover:text-secondary/80 mb-2 text-sm inline-flex items-center gap-1">
                                    <ArrowLeft className="w-3 h-3" /> Back to Donors
                                </Link>
                                <h1 className="text-3xl font-bold text-foreground">{fullName}</h1>
                                <p className="text-muted-foreground mt-1">{donor.email || 'No email'}</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="flex flex-col gap-2">
                                <StatusBadge status={donor.state} />
                                <StatusBadge status={donor.eligibility_status} />
                            </div>
                            {!editMode && (
                                <div className="flex gap-2">
                                    <Button onClick={handleEdit}>
                                        <Pencil className="w-4 h-4 mr-1" /> Edit Info
                                    </Button>
                                    <Button variant="destructive" onClick={handleDelete}>
                                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                                    </Button>
                                </div>
                            )}
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Personal Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Personal Information Card */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-semibold text-foreground">Personal Information</h2>
                                        {editMode && (
                                            <div className="flex gap-2">
                                                <Button onClick={handleSaveEdit}>Save</Button>
                                                <Button variant="secondary" onClick={handleCancelEdit}>Cancel</Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="mb-1">First Name</Label>
                                            {editMode ? (
                                                <Input
                                                    type="text"
                                                    value={editData.first_name}
                                                    onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                                                />
                                            ) : (
                                                <p className="text-foreground">{donor.first_name || 'N/A'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="mb-1">Last Name</Label>
                                            {editMode ? (
                                                <Input
                                                    type="text"
                                                    value={editData.last_name}
                                                    onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                                                />
                                            ) : (
                                                <p className="text-foreground">{donor.last_name || 'N/A'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="mb-1">Email</Label>
                                            {editMode ? (
                                                <Input
                                                    type="email"
                                                    value={editData.email}
                                                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                                />
                                            ) : (
                                                <p className="text-foreground">{donor.email || 'N/A'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="mb-1">Phone</Label>
                                            {editMode ? (
                                                <Input
                                                    type="tel"
                                                    value={editData.phone}
                                                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                                />
                                            ) : (
                                                <p className="text-foreground">{donor.phone || 'N/A'}</p>
                                            )}
                                        </div>
                                        <div className="col-span-2">
                                            <Label className="mb-1">Address</Label>
                                            {editMode ? (
                                                <Textarea
                                                    value={editData.address}
                                                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                                    rows={2}
                                                />
                                            ) : (
                                                <p className="text-foreground">{donor.address || 'N/A'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="mb-1">Date of Birth</Label>
                                            {editMode ? (
                                                <Input
                                                    type="date"
                                                    value={editData.date_of_birth}
                                                    onChange={(e) => setEditData({ ...editData, date_of_birth: e.target.value })}
                                                />
                                            ) : (
                                                <p className="text-foreground">
                                                    {donor.date_of_birth ? new Date(donor.date_of_birth).toLocaleDateString() : 'N/A'}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="mb-1">Bank</Label>
                                            <p className="text-foreground">{donor.bank_name || 'No bank selected'}</p>
                                        </div>
                                    </div>

                                    {/* Physical Characteristics */}
                                    {(donor.donor_type || donor.height_cm || donor.blood_group) && (
                                        <>
                                            <Separator className="my-6" />
                                            <h3 className="text-lg font-semibold text-foreground mb-4">Physical Characteristics</h3>
                                            <div className="grid grid-cols-3 gap-4">
                                                {donor.donor_type && (
                                                    <div>
                                                        <Label className="mb-1">Donor Type</Label>
                                                        <p className="text-foreground">{donor.donor_type}</p>
                                                    </div>
                                                )}
                                                {donor.height_cm && (
                                                    <div>
                                                        <Label className="mb-1">Height</Label>
                                                        <p className="text-foreground">{donor.height_cm} cm</p>
                                                    </div>
                                                )}
                                                {donor.weight_kg && (
                                                    <div>
                                                        <Label className="mb-1">Weight</Label>
                                                        <p className="text-foreground">{donor.weight_kg} kg</p>
                                                    </div>
                                                )}
                                                {donor.blood_group && (
                                                    <div>
                                                        <Label className="mb-1">Blood Group</Label>
                                                        <p className="text-foreground">{donor.blood_group}</p>
                                                    </div>
                                                )}
                                                {donor.hair_color && (
                                                    <div>
                                                        <Label className="mb-1">Hair Color</Label>
                                                        <p className="text-foreground">{donor.hair_color}</p>
                                                    </div>
                                                )}
                                                {donor.eye_color && (
                                                    <div>
                                                        <Label className="mb-1">Eye Color</Label>
                                                        <p className="text-foreground">{donor.eye_color}</p>
                                                    </div>
                                                )}
                                                {donor.skin_color && (
                                                    <div>
                                                        <Label className="mb-1">Skin Tone</Label>
                                                        <p className="text-foreground">{donor.skin_color}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Aadhaar Verification */}
                            {donor.aadhaar_number && (
                                <Card>
                                    <CardContent className="pt-6">
                                        <h2 className="text-xl font-semibold text-foreground mb-4">Aadhaar Verification</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Aadhaar Number</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-2xl font-mono tracking-widest text-foreground">
                                                        {donor.aadhaar_number.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')}
                                                    </p>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(donor.aadhaar_number!);
                                                            toast.success('Aadhaar number copied');
                                                        }}
                                                    >
                                                        Copy
                                                    </Button>
                                                </div>
                                                {donor.profile_picture_url && (
                                                    <div className="mt-4">
                                                        <p className="text-sm text-muted-foreground mb-2">Profile Photo</p>
                                                        <div className="w-32 h-32 rounded-lg border border-border overflow-hidden bg-muted">
                                                            <img src={donor.profile_picture_url} alt="Donor profile" className="w-full h-full object-cover" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-2">Government ID Document</p>
                                                {(() => {
                                                    const govDoc = legalDocuments?.find(d => d.type === 'government_id');
                                                    if (!govDoc) return <p className="text-muted-foreground italic">No government ID uploaded</p>;
                                                    return (
                                                        <div className="space-y-2">
                                                            <div className="border border-border rounded-lg p-3 bg-muted">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <p className="font-medium text-foreground">{govDoc.file_name}</p>
                                                                        <StatusBadge status={govDoc.status ?? 'pending'} />
                                                                    </div>
                                                                    <Button
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        onClick={() => viewDocument(govDoc.file_url)}
                                                                    >
                                                                        <Eye className="w-4 h-4 mr-1" /> View
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                Cross-reference the Aadhaar number with the uploaded government ID
                                                            </p>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Legal Documents */}
                            <Card>
                                <CardContent className="pt-6">
                                    <h2 className="text-xl font-semibold text-foreground mb-4">Legal Documents</h2>

                                    {!legalDocuments || legalDocuments.length === 0 ? (
                                        <p className="text-muted-foreground italic">No documents uploaded.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {legalDocuments.map((doc) => (
                                                <div key={doc.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-foreground">{documentTypeLabel(doc.type)}</p>
                                                        <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                                                        {doc.uploaded_at && (
                                                            <p className="text-sm text-muted-foreground">
                                                                Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                        {doc.verified_by && (
                                                            <p className="text-sm text-muted-foreground">
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
                                                        <StatusBadge status={doc.status ?? 'pending'} />
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => viewDocument(doc.file_url)}
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" /> View
                                                        </Button>
                                                        {doc.status !== 'verified' && doc.status !== 'rejected' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleVerifyDocument(doc.file_url)}
                                                                >
                                                                    Verify
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => handleRejectDocument(doc.file_url)}
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => handleRequestReupload(doc)}
                                                        >
                                                            Request Re-upload
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDeleteDocument(doc)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>



                            {/* Consent Forms */}
                            {donor.consents && donor.consents.length > 0 && (
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-xl font-semibold text-foreground">Consent Forms</h2>
                                            {donor.consent_pending && (
                                                <div className="flex gap-2">
                                                    <Button onClick={handleApproveConsent}>
                                                        Approve All
                                                    </Button>
                                                    <Button variant="destructive" onClick={handleRejectConsent}>
                                                        Reject All
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-3">
                                            {donor.consents.map((consent) => (
                                                <div key={consent.id} className="p-4 bg-muted rounded-lg">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium text-foreground">{consent.template_title}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Signed: {new Date(consent.signed_at).toLocaleDateString()}
                                                            </p>
                                                            {consent.verified_by && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    Verified by: {consent.verified_by}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <StatusBadge status={consent.status} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Test Reports - REMOVED PER USER REQUEST */}
                            {/* ADMIN SHOULD NOT SEE TEST RESULTS */}

                            {/* Counseling Sessions */}
                            {donor.counseling_sessions && donor.counseling_sessions.length > 0 && (
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-xl font-semibold text-foreground">Counseling Sessions</h2>
                                                <Badge className="bg-indigo-500 text-white hover:bg-indigo-500 rounded-full">
                                                    {donor.counseling_sessions.length} session{donor.counseling_sessions.length !== 1 ? 's' : ''}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {donor.counseling_sessions.map((session) => (
                                                <div key={session.id} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-indigo-600">{'💬'}</span>
                                                            <p className="font-medium text-foreground text-sm">
                                                                {session.method === 'video' ? 'Video Call' : session.method === 'in_person' ? 'In-Person' : session.method || 'Counseling Session'}
                                                            </p>
                                                            <StatusBadge status={session.status} />
                                                        </div>
                                                        <div className="ml-6 mt-1 space-y-0.5">
                                                            {session.scheduled_at && (
                                                                <p className="text-xs text-muted-foreground">
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
                                                                <p className="text-xs text-muted-foreground">
                                                                    Completed: {new Date(session.completed_at).toLocaleDateString()}
                                                                </p>
                                                            )}
                                                            {session.notes && (
                                                                <p className="text-xs text-muted-foreground">Notes: {session.notes}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {session.report_url && (
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => viewDocument(session.report_url!)}
                                                            >
                                                                <FileText className="w-4 h-4 mr-1" /> View Report
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Right Column - Status & History */}
                        <div className="space-y-6">
                            {/* Status Summary */}
                            <Card>
                                <CardContent className="pt-6">
                                    <h2 className="text-xl font-semibold text-foreground mb-4">Status Summary</h2>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-foreground">Consent Status</span>
                                            <StatusBadge status={donor.consent_pending ? 'pending' : 'verified'} />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-foreground">Counseling Status</span>
                                            <StatusBadge status={donor.counseling_pending ? 'pending' : 'completed'} />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-foreground">Tests Status</span>
                                            <StatusBadge status={donor.tests_pending ? 'pending' : 'verified'} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* State History */}
                            <Card>
                                <CardContent className="pt-6">
                                    <h2 className="text-xl font-semibold text-foreground mb-4">State History</h2>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {donor.state_history.map((history) => (
                                            <div key={history.id} className="border-l-4 border-secondary pl-4 py-2">
                                                <p className="font-medium text-foreground">
                                                    {history.from_state ? `${history.from_state} → ` : ''}
                                                    {history.to_state}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(history.created_at).toLocaleString()}
                                                </p>
                                                {history.changed_by && (
                                                    <p className="text-sm text-muted-foreground">
                                                        By: {history.changed_by} ({history.changed_by_role})
                                                    </p>
                                                )}
                                                {history.reason && (
                                                    <p className="text-sm text-muted-foreground italic">
                                                        Reason: {history.reason}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {showProfilePicture && profilePictureUrl && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
                    onClick={() => setShowProfilePicture(false)}
                >
                    <button
                        onClick={() => setShowProfilePicture(false)}
                        className="absolute top-6 right-6 text-white text-3xl leading-none hover:text-gray-300"
                        aria-label="Close"
                    >
                        &times;
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={profilePictureUrl}
                        alt={fullName}
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </DashboardLayout>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-foreground font-medium">{value}</span>
        </div>
    );
}
