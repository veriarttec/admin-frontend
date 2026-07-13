'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import useSWR from 'swr';
import api, { getApiErrorMessage } from '@/lib/api';
import { useConfirm } from '@/components/ConfirmDialog';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import Tooltip from '@/components/Tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Check, X, Eye, Pencil } from 'lucide-react';

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
    is_active: boolean;
    deactivated_at: string | null;
    deactivation_reason: string | null;
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
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const router = useRouter();
    const params = useParams();
    const bankId = params.id as string;

    useEffect(() => {
        setIsSuperAdmin(localStorage.getItem('admin_role') === 'super_admin');
    }, []);

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

    const handleTakeOffline = async () => {
        const reason = await confirm({
            title: 'Take bank offline?',
            description: "This will grey out the bank's entire dashboard and hide its donors from patients until reactivated.",
            destructive: true,
            confirmLabel: 'Take offline',
            input: { label: 'Reason for taking offline', required: true, multiline: true },
        }) as string | null;
        if (reason === null) return;
        try {
            await api.setBankActive(bankId, false, reason);
            mutate();
            toast.success('Bank taken offline');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleBringOnline = async () => {
        if (!(await confirm({
            title: 'Bring bank online?',
            confirmLabel: 'Bring online',
        }))) return;
        try {
            await api.setBankActive(bankId, true);
            mutate();
            toast.success('Bank brought online');
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
                <div className="p-8 text-muted-foreground">Loading bank details...</div>
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

    return (
        <DashboardLayout
            title={bank.name}
            onRefresh={() => { mutate(); mutateStorage(); }}
            actions={
                <div className="flex gap-2 items-center">
                    <Badge variant={bank.is_active ? 'default' : 'destructive'}
                           className={bank.is_active ? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
                        {bank.is_active ? 'Online' : 'Offline'}
                    </Badge>
                    <StatusBadge status={bank.is_verified ? 'verified' : 'unverified'} />
                    <StatusBadge status={bank.state} />
                    {!isEditing && (
                        <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                            Edit Info
                        </Button>
                    )}
                </div>
            }
        >
            <div className="dashboard-container">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/banks')}
                    className="text-muted-foreground hover:text-foreground mb-3"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Banks
                </Button>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-1">Email</p>
                        <p className="font-medium text-foreground">{bank.email}</p>
                    </CardContent>
                </Card>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="subscription">Subscription</TabsTrigger>
                        <TabsTrigger value="donors">Donors ({bank.donor_count})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <div className="space-y-6">
                            {isEditing ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Edit Bank Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label className="mb-2">Bank Name</Label>
                                            <Input
                                                type="text"
                                                value={editData.name}
                                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="mb-2">Phone</Label>
                                                <Input
                                                    type="text"
                                                    value={editData.phone || ''}
                                                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label className="mb-2">Website</Label>
                                                <Input
                                                    type="url"
                                                    value={editData.website || ''}
                                                    onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="mb-2">Address</Label>
                                            <Textarea
                                                value={editData.address || ''}
                                                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                                rows={3}
                                            />
                                        </div>
                                        <div>
                                            <Label className="mb-2">Description</Label>
                                            <Textarea
                                                value={editData.description || ''}
                                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                                rows={4}
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <Button onClick={handleSaveEdit}>Save Changes</Button>
                                            <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Basic Information</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <Table>
                                                    <TableBody>
                                                        <InfoRow label="Phone" value={bank.phone || 'Not provided'} />
                                                        <InfoRow label="Website" value={bank.website || 'Not provided'} isLink={!!bank.website} />
                                                        <InfoRow label="Address" value={bank.address || 'Not provided'} />
                                                        <InfoRow label="Donors" value={bank.donor_count.toString()} />
                                                        <InfoRow label="Consent Templates" value={bank.consent_template_count.toString()} />
                                                        <InfoRow label="Created" value={new Date(bank.created_at).toLocaleDateString()} />
                                                    </TableBody>
                                                </Table>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Verification & State</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex items-center gap-2 text-sm text-foreground">
                                                    <span className="text-muted-foreground">Status:</span>
                                                    <span className={`font-semibold ${bank.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                                                        {bank.is_verified ? 'Verified' : 'Pending Verification'}
                                                    </span>
                                                </div>
                                                {bank.verified_at && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground font-medium">Verified On</span>
                                                        <span className="text-foreground">{new Date(bank.verified_at).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                                {!bank.is_verified && (
                                                    <Button onClick={handleVerify} className="w-full">Verify Bank</Button>
                                                )}
                                                {isSuperAdmin ? (
                                                    <div className="pt-2">
                                                        <Label className="mb-2">Change State</Label>
                                                        <select
                                                            onChange={(e) => handleStateChange(e.target.value)}
                                                            value={bank.state}
                                                            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                        >
                                                            <optgroup label="Onboarding (auto-transition)">
                                                                <option value="account_created">Account Created</option>
                                                                <option value="verification_pending">Verification Pending</option>
                                                                <option value="verified">Verified</option>
                                                                <option value="subscription_pending">Subscription Pending</option>
                                                            </optgroup>
                                                            <optgroup label="Admin-managed">
                                                                <option value="operational">Operational</option>
                                                                <option value="conflicted">Conflicted (payment/issue pending)</option>
                                                                <option value="offboarded">Offboarded</option>
                                                            </optgroup>
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">Only super admins can change state.</p>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Availability</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="flex items-center gap-2 text-sm text-foreground">
                                                    <span className="text-muted-foreground">Status:</span>
                                                    <Badge variant={bank.is_active ? 'default' : 'destructive'}
                                                           className={bank.is_active ? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
                                                        {bank.is_active ? 'Online' : 'Offline'}
                                                    </Badge>
                                                </div>
                                                {!bank.is_active && bank.deactivation_reason && (
                                                    <p className="text-sm text-red-600">Reason: {bank.deactivation_reason}</p>
                                                )}
                                                {!bank.is_active && bank.deactivated_at && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground font-medium">Taken Offline On</span>
                                                        <span className="text-foreground">{new Date(bank.deactivated_at).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                                {isSuperAdmin ? (
                                                    bank.is_active ? (
                                                        <Button variant="destructive" onClick={handleTakeOffline} className="w-full">Take Offline</Button>
                                                    ) : (
                                                        <Button onClick={handleBringOnline} className="w-full">Bring Online</Button>
                                                    )
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">Only super admins can change availability.</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {bank.description && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Description</CardTitle>
                                            </CardHeader>
                                            <CardContent className="text-foreground">{bank.description}</CardContent>
                                        </Card>
                                    )}
                                </>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="documents">
                        <Card>
                            <CardHeader>
                                <CardTitle>Certification Documents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {bank.certification_documents && Array.isArray(bank.certification_documents) && bank.certification_documents.length > 0 && (
                                    <div className="space-y-3 mb-6">
                                        <h3 className="text-sm font-semibold text-foreground mb-3">Database Records</h3>
                                        {bank.certification_documents.map((doc: any, index: number) => (
                                            <div key={`db-${index}`} className="p-4 bg-muted rounded-lg border border-border">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-foreground">{doc.filename || 'Document'}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Status: <span className={`font-semibold ${doc.status === 'verified' ? 'text-green-600' :
                                                                doc.status === 'pending' ? 'text-yellow-600' :
                                                                    doc.status === 'rejected' ? 'text-red-600' :
                                                                        'text-muted-foreground'
                                                            }`}>
                                                                {doc.status || 'Unknown'}
                                                            </span>
                                                        </p>
                                                        {doc.uploaded_at && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Uploaded: {new Date(doc.uploaded_at).toLocaleString()}
                                                            </p>
                                                        )}
                                                        {doc.reviewed_at && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Reviewed: {new Date(doc.reviewed_at).toLocaleString()}
                                                            </p>
                                                        )}
                                                        {doc.reviewed_by && (
                                                            <p className="text-xs text-muted-foreground">
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
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => router.push(`/documents/view?url=${encodeURIComponent(doc.url)}&name=${encodeURIComponent(doc.name || 'Document')}`)}
                                                            >
                                                                <Eye className="h-3.5 w-3.5 mr-1.5" />
                                                                View
                                                            </Button>
                                                        )}
                                                        {doc.status !== 'verified' && (
                                                            <Tooltip label="Mark document as verified">
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                                    onClick={() => handleVerifyDocument(index)}
                                                                >
                                                                    <Check className="h-3.5 w-3.5 mr-1.5" />
                                                                    Verify
                                                                </Button>
                                                            </Tooltip>
                                                        )}
                                                        {doc.status !== 'rejected' && (
                                                            <Tooltip label="Reject document">
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => handleRejectDocument(index)}
                                                                >
                                                                    <X className="h-3.5 w-3.5 mr-1.5" />
                                                                    Reject
                                                                </Button>
                                                            </Tooltip>
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
                                        <p className="text-muted-foreground text-center py-8">No documents uploaded</p>
                                    )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="subscription">
                        <SubscriptionTab bank={bank} onUpdate={() => mutate()} />
                    </TabsContent>

                    <TabsContent value="donors">
                        <Card>
                            <CardHeader>
                                <CardTitle>Donors</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={() => router.push(`/donors?bank_id=${bankId}`)}
                                >
                                    View All Donors ({bank.donor_count})
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
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
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Subscription Details</CardTitle>
                {!isEditing && (
                    <Button variant="secondary" onClick={() => setIsEditing(true)}>
                        {bank.is_subscribed ? 'Edit Subscription' : 'Add Subscription'}
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <div className="space-y-4">
                        <div>
                            <Label className="mb-2">Tier</Label>
                            <select
                                value={subData.subscription_tier}
                                onChange={(e) => setSubData({ ...subData, subscription_tier: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="Starter">Starter - $999/month</option>
                                <option value="Professional">Professional - $2,499/month</option>
                                <option value="Enterprise">Enterprise - $4,999/month</option>
                            </select>
                        </div>
                        <div>
                            <Label className="mb-2">Start Date</Label>
                            <Input
                                type="date"
                                value={subData.subscription_started_at}
                                onChange={(e) => setSubData({ ...subData, subscription_started_at: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label className="mb-2">Expiry Date</Label>
                            <Input
                                type="date"
                                value={subData.subscription_expires_at}
                                onChange={(e) => setSubData({ ...subData, subscription_expires_at: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={handleSave}>
                                Save Subscription
                            </Button>
                            <Button variant="secondary" onClick={() => setIsEditing(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : bank.is_subscribed ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-muted">
                            <p className="text-gray-400 text-sm">Tier</p>
                            <p className="text-2xl font-bold text-indigo-400">{bank.subscription_tier}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted">
                            <p className="text-gray-400 text-sm">Started</p>
                            <p className="text-lg">
                                {bank.subscription_started_at
                                    ? new Date(bank.subscription_started_at).toLocaleDateString()
                                    : 'N/A'}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted">
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
            </CardContent>
        </Card>
    );
}

function InfoRow({ label, value, isLink = false }: { label: string; value: string; isLink?: boolean }) {
    const content = isLink && value !== 'Not provided'
        ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{value}</a>
        : <span className="text-foreground">{value}</span>;

    return (
        <TableRow>
            <TableCell className="text-muted-foreground font-medium w-1/2">{label}</TableCell>
            <TableCell className="text-right">{content}</TableCell>
        </TableRow>
    );
}
