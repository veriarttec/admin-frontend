'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

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
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const dashboardData = await api.getDashboard();
                setData(dashboardData);
            } catch (err) {
                if (err instanceof Error && err.message.includes('401')) {
                    router.push('/login');
                } else {
                    setError(err instanceof Error ? err.message : 'Failed to load dashboard');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [router]);

    const stats = data?.stats;

    return (
        <DashboardLayout title="Dashboard">
            {loading && (
                <div className="text-center py-8 text-gray-500">Loading dashboard...</div>
            )}
            {error && (
                <div className="text-center py-8 text-red-500">{error}</div>
            )}
            {!loading && !error && (
                <div className="dashboard-container">
                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <StatCard
                            title="Total Banks"
                            value={stats?.total_banks || 0}
                            subtitle={`${stats?.verified_banks || 0} verified`}
                            icon={
                                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Subscribed Banks"
                            value={stats?.subscribed_banks || 0}
                            subtitle={`${stats?.expiring_subscriptions || 0} expiring soon`}
                            icon={
                                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Total Donors"
                            value={stats?.total_donors || 0}
                            subtitle={`${stats?.onboarded_donors || 0} onboarded`}
                            icon={
                                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Pending Actions"
                            value={stats?.pending_verifications || 0}
                            subtitle="verifications pending"
                            icon={
                                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />
                    </div>

                    <div className="panels-grid">
                        {/* Subscription Breakdown */}
                        <div className="table-card">
                            <div className="table-card-header">
                                <h2>Subscription Tiers</h2>
                            </div>
                            <div className="table-compact">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Tier</th>
                                            <th>Banks</th>
                                            <th className="text-right">Revenue (/mo)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data?.subscription_breakdown.map((tier) => (
                                            <tr key={tier.tier}>
                                                <td className="font-medium text-gray-900">{tier.tier}</td>
                                                <td className="text-gray-700">{tier.count} {tier.count === 1 ? 'bank' : 'banks'}</td>
                                                <td className="text-right">
                                                    <span className="amount-positive">${tier.revenue_estimate.toLocaleString()}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!data?.subscription_breakdown || data.subscription_breakdown.length === 0) && (
                                            <tr>
                                                <td colSpan={3} className="text-center text-gray-500">No active subscriptions</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="table-card">
                            <div className="table-card-header">
                                <h2>Recent Activity</h2>
                            </div>
                            <div className="table-compact">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Admin</th>
                                            <th>Action</th>
                                            <th className="text-right">When</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data?.recent_activity.slice(0, 8).map((log) => (
                                            <tr key={log.id}>
                                                <td className="font-medium text-gray-900">{log.admin_name || 'System'}</td>
                                                <td className="text-gray-700" style={{ textTransform: 'capitalize' }}>{log.action.replace('_', ' ')}</td>
                                                <td className="text-right text-gray-700 text-sm">{new Date(log.created_at).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {(!data?.recent_activity || data.recent_activity.length === 0) && (
                                            <tr>
                                                <td colSpan={3} className="text-center text-gray-500">No recent activity</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
        <div className="stat-card h-full">
            <div className="flex items-start justify-between mb-4">
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</div>
                <div className="flex-shrink-0">{icon}</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
            <div className="text-sm text-gray-500">{subtitle}</div>
        </div>
    );
}
