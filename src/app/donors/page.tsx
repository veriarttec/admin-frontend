'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

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
    'visitor', 'bank_selected', 'lead_created', 'account_created',
    'counseling_requested', 'consent_pending', 'consent_verified',
    'tests_pending', 'eligibility_decision', 'donor_onboarded'
];

export default function DonorsPage() {
    const [data, setData] = useState<DonorListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
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

    useEffect(() => {
        fetchDonors();
    }, [stateFilter]);

    const fetchDonors = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (stateFilter) params.state = stateFilter;
            if (search) params.search = search;

            const response = await api.getDonors(params);
            setData(response);
        } catch (err) {
            if (err instanceof Error && err.message.includes('401')) {
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchDonors();
    };

    const handleCreateDonor = async () => {
        if (!newDonor.first_name || !newDonor.last_name) {
            alert('First name and last name are required');
            return;
        }

        try {
            const result = await api.createDonor(newDonor);
            alert(`Donor created successfully!${result.temp_password ? `\nTemporary password: ${result.temp_password}` : ''}`);
            setShowCreateModal(false);
            setNewDonor({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                address: '',
                date_of_birth: ''
            });
            fetchDonors();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to create donor');
        }
    };

    const getStateBadge = (state: string) => {
        if (state === 'donor_onboarded') return 'badge-success';
        if (['consent_verified', 'tests_pending', 'eligibility_decision'].includes(state)) return 'badge-info';
        if (['visitor', 'bank_selected', 'lead_created'].includes(state)) return 'badge-warning';
        return 'badge-secondary';
    };

    const getEligibilityBadge = (status: string) => {
        if (status === 'approved') return 'badge-success';
        if (status === 'rejected') return 'badge-danger';
        return 'badge-warning';
    };

    return (
        <DashboardLayout title="Donors" onRefresh={fetchDonors}>
            {/* Filters */}
            <div className="table-card mb-6">
                <div className="p-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[320px]">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or email..."
                                className="glass-input flex-1"
                            />
                            <button type="submit" className="btn-primary">Search</button>
                        </form>

                        <select
                            value={stateFilter}
                            onChange={(e) => setStateFilter(e.target.value)}
                            className="glass-input"
                            style={{ width: 'auto', minWidth: '180px' }}
                        >
                            <option value="">All States</option>
                            {DONOR_STATES.map((state) => (
                                <option key={state} value={state}>
                                    {state.replace(/_/g, ' ')}
                                </option>
                            ))}
                        </select>

                        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                            + Create Donor
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="table-card">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading donors...</div>
                ) : (
                    <div className="table-compact">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Bank</th>
                                    <th>State</th>
                                    <th>Eligibility</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.items.map((donor) => (
                                    <tr key={donor.id}>
                                        <td className="font-medium text-gray-900">
                                            {donor.first_name && donor.last_name
                                                ? `${donor.first_name} ${donor.last_name}`
                                                : 'Unknown'}
                                        </td>
                                        <td className="text-gray-600">{donor.email || '-'}</td>
                                        <td className="text-gray-900">{donor.bank_name || <span className="text-gray-500">No bank</span>}</td>
                                        <td>
                                            <span className={`badge ${getStateBadge(donor.state)}`}>
                                                {donor.state.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${getEligibilityBadge(donor.eligibility_status)}`}>
                                                {donor.eligibility_status}
                                            </span>
                                        </td>
                                        <td className="text-gray-600">{new Date(donor.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                onClick={() => router.push(`/donors/${donor.id}`)}
                                                className="action-icon"
                                                title="View Details"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!data?.items || data.items.length === 0) && (
                                    <tr>
                                        <td colSpan={7} className="text-center text-gray-500">
                                            No donors found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="mt-4 text-gray-600 text-sm">
                Showing {data?.items.length || 0} of {data?.total || 0} donors
            </div>

            {/* Create Donor Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Donor</h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                    <input
                                        type="text"
                                        value={newDonor.first_name}
                                        onChange={(e) => setNewDonor({ ...newDonor, first_name: e.target.value })}
                                        className="glass-input w-full"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                    <input
                                        type="text"
                                        value={newDonor.last_name}
                                        onChange={(e) => setNewDonor({ ...newDonor, last_name: e.target.value })}
                                        className="glass-input w-full"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={newDonor.email}
                                    onChange={(e) => setNewDonor({ ...newDonor, email: e.target.value })}
                                    className="glass-input w-full"
                                    placeholder="Optional - will generate temporary password if provided"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={newDonor.phone}
                                    onChange={(e) => setNewDonor({ ...newDonor, phone: e.target.value })}
                                    className="glass-input w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    value={newDonor.address}
                                    onChange={(e) => setNewDonor({ ...newDonor, address: e.target.value })}
                                    className="glass-input w-full"
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    value={newDonor.date_of_birth}
                                    onChange={(e) => setNewDonor({ ...newDonor, date_of_birth: e.target.value })}
                                    className="glass-input w-full"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={handleCreateDonor} className="btn-primary flex-1">
                                Create Donor
                            </button>
                            <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
