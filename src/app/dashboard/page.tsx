'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Building2, CheckCircle, Users, Clock, FileText, CreditCard,
    ChevronRight, TrendingUp, AlertTriangle, UserPlus
} from 'lucide-react';

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
    entity_id?: string;
    created_at: string;
}

interface DashboardData {
    stats: DashboardStats;
    subscription_breakdown: SubscriptionSummary[];
    recent_activity: ActivityLog[];
}

const PIPELINE_STAGES = [
    { key: 'new', label: 'New', color: 'bg-blue-400' },
    { key: 'verifying', label: 'Verifying', color: 'bg-amber-400' },
    { key: 'verified', label: 'Verified', color: 'bg-cyan-400' },
    { key: 'subscribing', label: 'Subscribing', color: 'bg-purple-400' },
    { key: 'operational', label: 'Operational', color: 'bg-green-500' },
];

function derivePipelineCounts(stats: DashboardStats) {
    const operational = stats.operational_banks || 0;
    const subscribed = stats.subscribed_banks || 0;
    const verified = stats.verified_banks || 0;
    const total = stats.total_banks || 0;

    const subscribing = Math.max(0, subscribed - operational);
    const verifiedOnly = Math.max(0, verified - subscribed);
    const verifying = Math.max(0, total - verified - subscribing);
    const newBanks = Math.max(0, total - operational - subscribing - verifiedOnly - verifying);

    return [
        { ...PIPELINE_STAGES[0], count: newBanks },
        { ...PIPELINE_STAGES[1], count: verifying },
        { ...PIPELINE_STAGES[2], count: verifiedOnly },
        { ...PIPELINE_STAGES[3], count: subscribing },
        { ...PIPELINE_STAGES[4], count: operational },
    ];
}

function getActivityLink(log: ActivityLog): string | null {
    if (!log.entity_id) return null;
    if (log.entity_type === 'bank') return `/banks/${log.entity_id}`;
    if (log.entity_type === 'donor') return `/donors/${log.entity_id}`;
    if (log.entity_type === 'subscription') return '/subscriptions';
    return null;
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
    const pipeline = stats ? derivePipelineCounts(stats) : [];
    const pipelineTotal = pipeline.reduce((sum, s) => sum + s.count, 0);

    return (
        <DashboardLayout title="Dashboard">
            {isLoading && (
                <div className="text-center py-8 text-muted-foreground">Loading dashboard...</div>
            )}
            {error && !error.message?.includes('401') && (
                <div className="text-center py-8 text-red-500">{error.message || 'Failed to load dashboard'}</div>
            )}
            {!isLoading && !error && (
                <div className="max-w-[1200px] mx-auto space-y-6">
                    {/* Stats Grid — clickable cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Banks"
                            value={stats?.total_banks || 0}
                            subtitle={`${stats?.verified_banks || 0} verified`}
                            icon={<Building2 className="w-8 h-8 text-blue-500" />}
                            href="/banks"
                        />
                        <StatCard
                            title="Subscribed Banks"
                            value={stats?.subscribed_banks || 0}
                            subtitle={`${stats?.expiring_subscriptions || 0} expiring soon`}
                            icon={<CheckCircle className="w-8 h-8 text-green-500" />}
                            href="/subscriptions"
                            alert={stats?.expired_subscriptions ? `${stats.expired_subscriptions} expired` : undefined}
                        />
                        <StatCard
                            title="Total Donors"
                            value={stats?.total_donors || 0}
                            subtitle={`${stats?.onboarded_donors || 0} onboarded`}
                            icon={<Users className="w-8 h-8 text-purple-500" />}
                            href="/donors"
                            trend={stats?.recent_signups ? `+${stats.recent_signups} this week` : undefined}
                        />
                        <StatCard
                            title="Pending Actions"
                            value={stats?.pending_verifications || 0}
                            subtitle="verifications pending"
                            icon={<Clock className="w-8 h-8 text-orange-500" />}
                            href="/documents"
                        />
                    </div>

                    {/* Bank Pipeline */}
                    {pipelineTotal > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Bank Lifecycle Pipeline</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex h-8 rounded-lg overflow-hidden mb-3">
                                    {pipeline.map((stage) =>
                                        stage.count > 0 ? (
                                            <div
                                                key={stage.key}
                                                className={`${stage.color} transition-all relative group`}
                                                style={{ width: `${(stage.count / pipelineTotal) * 100}%` }}
                                                title={`${stage.label}: ${stage.count}`}
                                            >
                                                {stage.count / pipelineTotal > 0.08 && (
                                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                                                        {stage.count}
                                                    </span>
                                                )}
                                            </div>
                                        ) : null
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    {pipeline.map((stage) => (
                                        <div key={stage.key} className="flex items-center gap-1.5 text-sm">
                                            <div className={`w-3 h-3 rounded-sm ${stage.color}`} />
                                            <span className="text-muted-foreground">{stage.label}</span>
                                            <span className="font-semibold text-foreground">{stage.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Subscription Breakdown */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Subscription Tiers</CardTitle>
                                    <Link href="/subscriptions" className="text-xs text-secondary hover:underline">
                                        Manage →
                                    </Link>
                                </div>
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
                                <div className="flex items-center justify-between">
                                    <CardTitle>Recent Activity</CardTitle>
                                    <Link href="/documents" className="text-xs text-secondary hover:underline">
                                        View all →
                                    </Link>
                                </div>
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
                                        {data?.recent_activity.slice(0, 8).map((log) => {
                                            const link = getActivityLink(log);
                                            const Row = (
                                                <TableRow key={log.id} className={link ? 'cursor-pointer hover:bg-muted/50' : ''}>
                                                    <TableCell className="font-medium text-foreground">{log.admin_name || 'System'}</TableCell>
                                                    <TableCell className="text-foreground capitalize">{log.action.replace(/_/g, ' ')}</TableCell>
                                                    <TableCell className="text-right text-foreground text-sm">{new Date(log.created_at).toLocaleString()}</TableCell>
                                                </TableRow>
                                            );
                                            return link ? (
                                                <Link key={log.id} href={link} className="contents">
                                                    {Row}
                                                </Link>
                                            ) : Row;
                                        })}
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

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <QuickAction
                            title="Manage Banks"
                            description="View, verify, and manage banks"
                            icon={<Building2 className="w-5 h-5" />}
                            href="/banks"
                        />
                        <QuickAction
                            title="Manage Donors"
                            description="View donor profiles and documents"
                            icon={<Users className="w-5 h-5" />}
                            href="/donors"
                        />
                        <QuickAction
                            title="Subscriptions"
                            description="Plans, analytics, and billing"
                            icon={<CreditCard className="w-5 h-5" />}
                            href="/subscriptions"
                        />
                        <QuickAction
                            title="Documents"
                            description="Review pending verifications"
                            icon={<FileText className="w-5 h-5" />}
                            href="/documents"
                        />
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

function StatCard({ title, value, subtitle, icon, href, alert, trend }: {
    title: string;
    value: number;
    subtitle: string;
    icon: React.ReactNode;
    href?: string;
    alert?: string;
    trend?: string;
}) {
    const content = (
        <Card className={`h-full ${href ? 'hover:shadow-md hover:border-secondary/30 transition-all cursor-pointer' : ''}`}>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</div>
                    <div className="flex-shrink-0">{icon}</div>
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">{value}</div>
                <div className="text-sm text-muted-foreground">{subtitle}</div>
                {alert && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                        <AlertTriangle className="w-3 h-3" />
                        {alert}
                    </div>
                )}
                {trend && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                        <TrendingUp className="w-3 h-3" />
                        {trend}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }
    return content;
}

function QuickAction({ title, description, icon, href }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
}) {
    return (
        <Link href={href}>
            <Card className="h-full hover:shadow-md hover:border-secondary/30 transition-all cursor-pointer">
                <CardContent className="pt-5 pb-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary flex-shrink-0">
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground">{title}</div>
                        <div className="text-xs text-muted-foreground">{description}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </CardContent>
            </Card>
        </Link>
    );
}
