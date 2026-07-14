'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useSWR from 'swr';
import api, { getApiErrorMessage } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { EmptyState } from '@/components/TablePrimitives';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Eye } from 'lucide-react';

interface Donor {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    state: string;
    bank_id: string | null;
    bank_name: string | null;
    eligibility_status: string;
    aadhaar_number: string | null;
    created_at: string;
}

interface DonorListResponse {
    items: Donor[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

const DONOR_STATES = [
    'lead created', 'account created',
    'medical information submitted',
    'legal document verification pending', 'legal document verification verified', 'legal document verification rejected',
    'consent forms uploaded', 'consent forms verified', 'consent forms rejected',
    'counseling requested', 'counseling verified', 'counseling rejected',
    'test reports scheduling requested', 'test reports uploaded', 'test reports verified', 'test reports rejected',
    'pending bank approval', 'donor onboarded', 'donor rejected'
];

export default function DonorsPage() {
    const [search, setSearch] = useState('');
    const [submittedSearch, setSubmittedSearch] = useState('');
    const [aadhaarSearch, setAadhaarSearch] = useState('');
    const [submittedAadhaarSearch, setSubmittedAadhaarSearch] = useState('');
    const [stateFilter, setStateFilter] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newDonor, setNewDonor] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        date_of_birth: ''
    });
    const router = useRouter();

    const { data, isLoading, mutate } = useSWR<DonorListResponse>(
        ['donors', stateFilter, submittedSearch, submittedAadhaarSearch],
        () => {
            const params: any = {};
            if (stateFilter) params.state = stateFilter;
            if (submittedSearch) params.search = submittedSearch;
            if (submittedAadhaarSearch) params.aadhaar_search = submittedAadhaarSearch;
            return api.getDonors(params);
        },
        {
            refreshInterval: 30_000,
            keepPreviousData: true,
            onError: (err) => {
                if (err instanceof Error && err.message.includes('401')) {
                    router.push('/login');
                }
            },
        }
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittedSearch(search);
    };

    const handleAadhaarSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittedAadhaarSearch(aadhaarSearch.replace(/\D/g, ''));
    };

    const handleCreateDonor = async () => {
        if (!newDonor.first_name || !newDonor.last_name) {
            toast.error('First name and last name are required');
            return;
        }
        const nameRe = /^[A-Za-z][A-Za-z\s.'-]*$/;
        if (!nameRe.test(newDonor.first_name.trim()) || !nameRe.test(newDonor.last_name.trim())) {
            toast.error('Names can only contain letters, spaces, apostrophes, hyphens and dots');
            return;
        }
        if (newDonor.email && !/^[^\s@]+@[^\s@]{3,}\.[^\s@]{2,}$/.test(newDonor.email.trim())) {
            toast.error('Enter a valid email address');
            return;
        }
        if (newDonor.phone && !/^(\+91)?[\s-]?[6-9]\d{9}$/.test(newDonor.phone.replace(/[\s\-()]/g, ''))) {
            toast.error('Enter a valid 10-digit Indian mobile number');
            return;
        }

        try {
            const result = await api.createDonor(newDonor);
            toast.success(`Donor created successfully!${result.temp_password ? ` Temporary password: ${result.temp_password}` : ''}`);
            setShowCreateModal(false);
            setNewDonor({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                address: '',
                date_of_birth: ''
            });
            mutate();
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };


    return (
        <DashboardLayout title="Donors" onRefresh={() => mutate()}>
            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[320px]">
                            <Input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or email..."
                                className="flex-1"
                            />
                            <Button type="submit">Search</Button>
                        </form>

                        <form onSubmit={handleAadhaarSearch} className="flex gap-2 min-w-[200px]">
                            <Input
                                type="text"
                                value={aadhaarSearch}
                                onChange={(e) => setAadhaarSearch(e.target.value)}
                                placeholder="Search by Aadhaar..."
                                className="w-48 font-mono"
                                maxLength={14}
                            />
                            <Button type="submit" variant="outline" size="sm">Go</Button>
                        </form>

                        <select
                            value={stateFilter}
                            onChange={(e) => setStateFilter(e.target.value)}
                            className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            style={{ width: 'auto', minWidth: '180px' }}
                        >
                            <option value="">All States</option>
                            {DONOR_STATES.map((state) => (
                                <option key={state} value={state}>
                                    {state.charAt(0).toUpperCase() + state.slice(1)}
                                </option>
                            ))}
                        </select>

                        <Button onClick={() => setShowCreateModal(true)}>
                            + Create Donor
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                {isLoading ? (
                    <div className="p-12 text-center text-muted-foreground">Loading donors...</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Bank</TableHead>
                                <TableHead>State</TableHead>
                                <TableHead>Eligibility</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.items.map((donor) => (
                                <TableRow key={donor.id}>
                                    <TableCell className="font-medium text-foreground">
                                        {donor.first_name && donor.last_name
                                            ? `${donor.first_name} ${donor.last_name}`
                                            : 'Unknown'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{donor.email || '-'}</TableCell>
                                    <TableCell className="text-foreground">{donor.bank_name || <span className="text-muted-foreground">No bank</span>}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={donor.state} />
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={donor.eligibility_status} />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{new Date(donor.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => router.push(`/donors/${donor.id}`)}
                                            className="text-secondary cursor-pointer hover:bg-muted p-1 rounded"
                                            title="View Details"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!data?.items || data.items.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <EmptyState
                                            title="No donors found"
                                            description="Donors appear here once they register or are created."
                                            action={
                                                <Button onClick={() => setShowCreateModal(true)}>
                                                    + Create Donor
                                                </Button>
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* Summary */}
            <div className="mt-4 text-muted-foreground text-sm">
                Showing {data?.items.length || 0} of {data?.total || 0} donors
            </div>

            {/* Create Donor Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
                    <Card className="max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <CardContent className="p-8">
                            <h2 className="text-2xl font-bold text-foreground mb-6">Create New Donor</h2>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="mb-1">First Name *</Label>
                                        <Input
                                            type="text"
                                            value={newDonor.first_name}
                                            onChange={(e) => setNewDonor({ ...newDonor, first_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label className="mb-1">Last Name *</Label>
                                        <Input
                                            type="text"
                                            value={newDonor.last_name}
                                            onChange={(e) => setNewDonor({ ...newDonor, last_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="mb-1">Email</Label>
                                    <Input
                                        type="email"
                                        value={newDonor.email}
                                        onChange={(e) => setNewDonor({ ...newDonor, email: e.target.value })}
                                        placeholder="Optional - will generate temporary password if provided"
                                    />
                                </div>

                                <div>
                                    <Label className="mb-1">Phone</Label>
                                    <Input
                                        type="tel"
                                        value={newDonor.phone}
                                        onChange={(e) => setNewDonor({ ...newDonor, phone: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label className="mb-1">Address</Label>
                                    <Textarea
                                        value={newDonor.address}
                                        onChange={(e) => setNewDonor({ ...newDonor, address: e.target.value })}
                                        rows={2}
                                    />
                                </div>

                                <div>
                                    <Label className="mb-1">Date of Birth</Label>
                                    <Input
                                        type="date"
                                        value={newDonor.date_of_birth}
                                        onChange={(e) => setNewDonor({ ...newDonor, date_of_birth: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button onClick={handleCreateDonor} className="flex-1">
                                    Create Donor
                                </Button>
                                <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </DashboardLayout>
    );
}
