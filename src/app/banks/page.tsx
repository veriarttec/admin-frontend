'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { Pagination } from '@/components/TablePrimitives';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';

interface Bank {
    id: string;
    email: string;
    name: string;
    state: string;
    is_verified: boolean;
    is_active: boolean;
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
    const [search, setSearch] = useState('');
    const [submittedSearch, setSubmittedSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'subscribed'>('all');
    const [page, setPage] = useState(1);
    const router = useRouter();

    const { data, isLoading, mutate } = useSWR<BankListResponse>(
        ['banks', page, filter, submittedSearch],
        () => {
            const params: any = { page };
            if (filter === 'verified') params.is_verified = true;
            if (filter === 'unverified') params.is_verified = false;
            if (filter === 'subscribed') params.is_subscribed = true;
            if (submittedSearch) params.search = submittedSearch;
            return api.getBanks(params);
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
        setPage(1);
        setSubmittedSearch(search);
    };


    const getSubscriptionStatus = (bank: Bank) => {
        if (!bank.is_subscribed) return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">Not Subscribed</Badge>;
        if (bank.subscription_expires_at) {
            const expiry = new Date(bank.subscription_expires_at);
            const now = new Date();
            const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry < 0) return <Badge variant="destructive">Expired</Badge>;
            if (daysUntilExpiry <= 30) return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">Expiring in {daysUntilExpiry}d</Badge>;
        }
        return <Badge className="bg-green-600 text-white">{bank.subscription_tier}</Badge>;
    };

    return (
        <DashboardLayout title="Banks" onRefresh={() => mutate()}>
            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[320px]">
                            <Input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search banks by name or email..."
                                className="flex-1"
                            />
                            <Button type="submit">Search</Button>
                        </form>

                        <select
                            value={filter}
                            onChange={(e) => {
                                setFilter(e.target.value as typeof filter);
                                setPage(1);
                            }}
                            className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            style={{ width: 'auto', minWidth: '180px' }}
                        >
                            <option value="all">All</option>
                            <option value="verified">Verified</option>
                            <option value="unverified">Unverified</option>
                            <option value="subscribed">Subscribed</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                {isLoading ? (
                    <div className="p-12 text-center text-muted-foreground">Loading banks...</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bank Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>State</TableHead>
                                <TableHead>Availability</TableHead>
                                <TableHead>Subscription</TableHead>
                                <TableHead>Donors</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.items.map((bank) => (
                                <TableRow key={bank.id}>
                                    <TableCell className="font-medium text-foreground">{bank.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{bank.email}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={bank.state} />
                                    </TableCell>
                                    <TableCell>
                                        {bank.is_active ? (
                                            <Badge className="bg-green-600 text-white">Online</Badge>
                                        ) : (
                                            <Badge variant="destructive">Offline</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{getSubscriptionStatus(bank)}</TableCell>
                                    <TableCell className="text-foreground font-medium">{bank.donor_count}</TableCell>
                                    <TableCell className="text-muted-foreground">{new Date(bank.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => router.push(`/banks/${bank.id}`)}
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
                                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                                        No banks found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* Pagination */}
            <Pagination
                page={page}
                totalPages={data?.total_pages ?? 0}
                onPageChange={setPage}
                totalItems={data?.total}
            />
        </DashboardLayout>
    );
}
