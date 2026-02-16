'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

interface Bank {
    id: string;
    email: string;
    name: string;
    state: string;
    is_verified: boolean;
    is_subscribed: boolean;
    subscription_tier: string | null;
    subscription_expires_at: string | null;
    donor_count: number;
    created_at: string;
}

interface BankListResponse {
    items: Bank[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export default function BanksPage() {
    const [data, setData] = useState<BankListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'subscribed'>('all');
    const router = useRouter();

    useEffect(() => {
        fetchBanks();
    }, [filter]);

    const fetchBanks = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filter === 'verified') params.is_verified = true;
            if (filter === 'unverified') params.is_verified = false;
            if (filter === 'subscribed') params.is_subscribed = true;
            if (search) params.search = search;

            const response = await api.getBanks(params);
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
        fetchBanks();
    };

    const getStateBadge = (state: string) => {
        const badges: Record<string, string> = {
            operational: 'badge-success',
            verified: 'badge-info',
            subscribed_onboarded: 'badge-info',
            verification_pending: 'badge-warning',
            account_created: 'badge-secondary',
        };
        return badges[state] || 'badge-secondary';
    };

    const getSubscriptionStatus = (bank: Bank) => {
        if (!bank.is_subscribed) return <span className="badge badge-warning">Not Subscribed</span>;
        if (bank.subscription_expires_at) {
            const expiry = new Date(bank.subscription_expires_at);
            const now = new Date();
            const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry < 0) return <span className="badge badge-danger">Expired</span>;
            if (daysUntilExpiry <= 30) return <span className="badge badge-warning">Expiring in {daysUntilExpiry}d</span>;
        }
        return <span className="badge badge-success">{bank.subscription_tier}</span>;
    };

    return (
        <DashboardLayout title="Banks" onRefresh={fetchBanks}>
            {/* Filters */}
            <div className="table-card mb-6">
                <div className="p-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[320px]">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search banks by name or email..."
                                className="glass-input flex-1"
                            />
                            <button type="submit" className="btn-primary">Search</button>
                        </form>

                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as typeof filter)}
                            className="glass-input"
                            style={{ width: 'auto', minWidth: '180px' }}
                        >
                            <option value="all">All</option>
                            <option value="verified">Verified</option>
                            <option value="unverified">Unverified</option>
                            <option value="subscribed">Subscribed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="table-card">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading banks...</div>
                ) : (
                    <div className="table-compact">
                        <table>
                            <thead>
                                <tr>
                                    <th>Bank Name</th>
                                    <th>Email</th>
                                    <th>State</th>
                                    <th>Subscription</th>
                                    <th>Donors</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.items.map((bank) => (
                                    <tr key={bank.id}>
                                        <td className="font-medium text-gray-900">{bank.name}</td>
                                        <td className="text-gray-600">{bank.email}</td>
                                        <td>
                                            <span className={`badge ${getStateBadge(bank.state)}`}>
                                                {bank.state.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{getSubscriptionStatus(bank)}</td>
                                        <td className="text-gray-900 font-medium">{bank.donor_count}</td>
                                        <td className="text-gray-600">{new Date(bank.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                onClick={() => router.push(`/banks/${bank.id}`)}
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
                                        <td colSpan={7} className="text-center text-gray-500 py-12">
                                            No banks found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {data && data.total_pages > 1 && (
                <div className="mt-4 flex justify-center gap-2">
                    {Array.from({ length: data.total_pages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => api.getBanks({ page: i + 1 }).then(setData)}
                            className={`px-4 py-2 rounded text-sm font-medium ${data.page === i + 1
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
