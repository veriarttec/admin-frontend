'use client';

import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Building2, CheckCircle, Users, Clock } from 'lucide-react';

interface DashboardStats {
    total_banks: number;
    verified_banks: number;
    subscribed_banks: number;
    operational_banks: number;
    total_donors: number;
    onboarded_donors: number;
    pending_verifications: number;
    expiring_subscriptions: number;
    expired_subscriptions: number;
    recent_signups: number;
}

interface SubscriptionSummary {
    tier: string;
    count: number;
    revenue_estimate: number;
}

interface ActivityLog {
    id: string;
    admin_name: string;
    action: string;
    entity_type: string;
    created_at: string;
}

interface DashboardData {
    stats: DashboardStats;
    subscription_breakdown: SubscriptionSummary[];
    recent_activity: ActivityLog[];
}

export default function DashboardPage() {
    const router = useRouter();

    const { data, isLoading, error } = useSWR<DashboardData>(
        'dashboard',
        () => api.getDashboard(),
        {
            refreshInterval: 30_000,
            onError: (err) => {
                if (err instanceof Error && err.message.includes('401')) {
                    router.push('/login');
                }
            },
        }
    );

    const stats = data?.stats;

    return (
        <DashboardLayout title="Dashboard">
            {isLoading && (
                <div className="text-center py-8 text-muted-foreground">Loading dashboard...</div>
            )}
            {error && !error.message?.includes('401') && (
                <div className="text-center py-8 text-red-500">{error.message || 'Failed to load dashboard'}</div>
            )}
            {!isLoading && !error && (
                <div className="max-w-[1200px] mx-auto space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Banks"
                            value={stats?.total_banks || 0}
                            subtitle={`${stats?.verified_banks || 0} verified`}
                            icon={<Building2 className="w-8 h-8 text-blue-500" />}
                        />
                        <StatCard
                            title="Subscribed Banks"
                            value={stats?.subscribed_banks || 0}
                            subtitle={`${stats?.expiring_subscriptions || 0} expiring soon`}
                            icon={<CheckCircle className="w-8 h-8 text-green-500" />}
                        />
                        <StatCard
                            title="Total Donors"
                            value={stats?.total_donors || 0}
                            subtitle={`${stats?.onboarded_donors || 0} onboarded`}
                            icon={<Users className="w-8 h-8 text-purple-500" />}
                        />
                        <StatCard
                            title="Pending Actions"
                            value={stats?.pending_verifications || 0}
                            subtitle="verifications pending"
                            icon={<Clock className="w-8 h-8 text-orange-500" />}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Subscription Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Subscription Tiers</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tier</TableHead>
                                            <TableHead>Banks</TableHead>
                                            <TableHead className="text-right">Revenue (/mo)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.subscription_breakdown.map((tier) => (
                                            <TableRow key={tier.tier}>
                                                <TableCell className="font-medium text-foreground">{tier.tier}</TableCell>
                                                <TableCell className="text-foreground">{tier.count} {tier.count === 1 ? 'bank' : 'banks'}</TableCell>
                                                <TableCell className="text-right">
                                                    <span className="text-green-600 font-semibold">${tier.revenue_estimate.toLocaleString()}</span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!data?.subscription_breakdown || data.subscription_breakdown.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground">No active subscriptions</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Admin</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead className="text-right">When</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.recent_activity.slice(0, 8).map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium text-foreground">{log.admin_name || 'System'}</TableCell>
                                                <TableCell className="text-foreground capitalize">{log.action.replace('_', ' ')}</TableCell>
                                                <TableCell className="text-right text-foreground text-sm">{new Date(log.created_at).toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                        {(!data?.recent_activity || data.recent_activity.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground">No recent activity</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

function StatCard({ title, value, subtitle, icon }: {
    title: string;
    value: number;
    subtitle: string;
    icon: React.ReactNode;
}) {
    return (
        <Card className="h-full">
            <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</div>
                    <div className="flex-shrink-0">{icon}</div>
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">{value}</div>
                <div className="text-sm text-muted-foreground">{subtitle}</div>
            </CardContent>
        </Card>
    );
}
