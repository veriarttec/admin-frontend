'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useSWR from 'swr';
import api, { getApiErrorMessage } from '@/lib/api';
import { useConfirm } from '@/components/ConfirmDialog';
import DashboardLayout from '@/components/DashboardLayout';

interface SubscriptionSummary {
    tier: string;
    count: number;
    revenue_estimate: number;
}

interface MonthlyTrend {
    month: string;
    new_subscriptions: number;
}

interface AnalyticsData {
    active_subscriptions: number;
    expiring_soon: number;
    expired: number;
    never_subscribed: number;
    total_revenue_estimate: number;
    tier_breakdown: SubscriptionSummary[];
    monthly_trend: MonthlyTrend[];
}

interface SubscriptionDetail {
    bank_id: string;
    bank_name: string;
    bank_email: string;
    subscription_tier: string | null;
    subscription_started_at: string | null;
    subscription_expires_at: string | null;
    billing_details: any;
    is_subscribed: boolean;
    is_verified: boolean;
    donor_count: number;
    created_at: string;
}

export default function SubscriptionsPage() {
    const confirm = useConfirm();
    const [activeTab, setActiveTab] = useState<'analytics' | 'manage' | 'plans'>('analytics');
    const [filterActive, setFilterActive] = useState(true);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const router = useRouter();

    const { data: analytics, mutate: mutateAnalytics } = useSWR<AnalyticsData>(
        'subscription-analytics',
        () => api.getSubscriptionAnalytics(),
        {
            refreshInterval: 30_000,
            onError: (err) => {
                if (err instanceof Error && err.message.includes('401')) {
                    router.push('/login');
                }
            },
        }
    );

    const { data: subscriptions = [], mutate: mutateSubscriptions } = useSWR<SubscriptionDetail[]>(
        ['subscriptions', filterActive],
        () => api.getAllSubscriptions(filterActive),
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

    const { data: rawPlans, mutate: mutatePlans } = useSWR<any[]>(
        'subscription-plans',
        async () => {
            try {
                const plansData = await api.getSubscriptionPlans();
                return plansData.map((plan: any) => ({
                    ...plan,
                    price: parseFloat(plan.price),
                    max_donors: plan.max_donors === 'null' || plan.max_donors === null ? null : parseInt(plan.max_donors)
                }));
            } catch {
                return [];
            }
        },
        {
            refreshInterval: 30_000,
            onError: (err) => {
                if (err instanceof Error && err.message.includes('401')) {
                    router.push('/login');
                }
            },
        }
    );

    // Fall back to tier breakdown when plans API returns nothing and analytics are available
    const plans: any[] = (rawPlans && rawPlans.length > 0)
        ? rawPlans
        : (analytics?.tier_breakdown ?? []).map((tier) => ({
            id: tier.tier.toLowerCase().replace(/\s+/g, '_'),
            name: tier.tier,
            price: tier.revenue_estimate / (tier.count || 1),
            max_donors: null,
            description: `${tier.tier} subscription tier`,
            features: [],
            active_subscriptions: tier.count
        }));

    const loading = !analytics && !subscriptions.length && !rawPlans;

    const mutateAll = () => {
        mutateAnalytics();
        mutateSubscriptions();
        mutatePlans();
    };

    const handleCancelSubscription = async (bankId: string, bankName: string) => {
        if (!(await confirm({
            title: 'Cancel subscription?',
            description: `This will cancel the subscription for ${bankName}.`,
            destructive: true,
            confirmLabel: 'Cancel subscription',
        }))) return;
        try {
            await api.cancelSubscription(bankId);
            mutateAll();
            toast.success('Subscription cancelled successfully');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleEditPlan = (plan: any) => {
        setEditingPlan({ ...plan });
    };

    const handleSavePlan = async () => {
        if (!editingPlan) return;
        try {
            await api.updateSubscriptionPlan(editingPlan.id, {
                name: editingPlan.name,
                price: editingPlan.price,
                features: editingPlan.features,
                max_donors: editingPlan.max_donors,
                description: editingPlan.description
            });
            mutateAll();
            setEditingPlan(null);
            toast.success('Plan updated successfully. All banks with this plan will see the updated pricing and details.');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleCreatePlan = async () => {
        const id = await confirm({
            title: 'Create new plan — step 1 of 3',
            input: { label: 'Plan ID (e.g. basic, professional, enterprise)', required: true },
        }) as string | null;
        if (id === null) return;

        const name = await confirm({
            title: 'Create new plan — step 2 of 3',
            input: { label: 'Plan display name', required: true },
        }) as string | null;
        if (name === null) return;

        const price = await confirm({
            title: 'Create new plan — step 3 of 3',
            input: { label: 'Monthly price', required: true },
        }) as string | null;
        if (price === null) return;

        try {
            await api.createSubscriptionPlan({
                id: id.toLowerCase().replace(/\s+/g, '_'),
                name,
                price: parseFloat(price),
                features: [],
                max_donors: null,
                description: ''
            });
            mutateAll();
            toast.success('Plan created successfully');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleDeletePlan = async (planId: string, planName: string) => {
        if (!(await confirm({
            title: `Delete "${planName}" plan?`,
            description: 'This cannot be undone.',
            destructive: true,
            confirmLabel: 'Delete plan',
        }))) return;
        try {
            await api.deleteSubscriptionPlan(planId);
            mutateAll();
            toast.success('Plan deleted successfully');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <DashboardLayout title="Subscriptions">
            {loading ? (
                <div className="text-gray-500">Loading...</div>
            ) : (
                <div className="dashboard-container">
                    {/* Tabs */}
                    <div className="flex gap-4 mb-6 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`pb-3 px-4 font-medium transition-colors ${
                                activeTab === 'analytics'
                                    ? 'border-b-2 border-blue-500 text-gray-900'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Analytics
                        </button>
                        <button
                            onClick={() => setActiveTab('manage')}
                            className={`pb-3 px-4 font-medium transition-colors ${
                                activeTab === 'manage'
                                    ? 'border-b-2 border-blue-500 text-gray-900'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Manage Subscriptions ({subscriptions.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('plans')}
                            className={`pb-3 px-4 font-medium transition-colors ${
                                activeTab === 'plans'
                                    ? 'border-b-2 border-blue-500 text-gray-900'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Subscription Plans ({plans.length})
                        </button>
                        </div>

                    {activeTab === 'analytics' ? (
                        <>
                            {/* Summary Cards */}
                            <div className="stats-grid">
                                <div className="stat-card h-full">
                                    <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">Active Subscriptions</div>
                                    <div className="text-3xl font-bold text-green-600 mb-2">{analytics?.active_subscriptions || 0}</div>
                                </div>
                                <div className="stat-card h-full">
                                    <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">Expiring Soon</div>
                                    <div className="text-3xl font-bold text-yellow-600 mb-2">{analytics?.expiring_soon || 0}</div>
                                    <div className="text-sm text-gray-500">Next 30 days</div>
                                </div>
                                <div className="stat-card h-full">
                                    <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">Expired</div>
                                    <div className="text-3xl font-bold text-red-600 mb-2">{analytics?.expired || 0}</div>
                                </div>
                                <div className="stat-card h-full">
                                    <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">Monthly Revenue</div>
                                    <div className="text-3xl font-bold text-blue-600 mb-2">
                                        ${(analytics?.total_revenue_estimate || 0).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="panels-grid">
                                {/* Tier Breakdown */}
                                <div className="table-card">
                                    <div className="table-card-header">
                                        <h2>Tier Distribution</h2>
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
                                                {analytics?.tier_breakdown.map((tier) => (
                                                    <tr key={tier.tier}>
                                                        <td className="font-medium text-gray-900">{tier.tier}</td>
                                                        <td className="text-gray-700">{tier.count} {tier.count === 1 ? 'bank' : 'banks'}</td>
                                                        <td className="text-right">
                                                            <span className="amount-positive">${tier.revenue_estimate.toLocaleString()}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!analytics?.tier_breakdown || analytics.tier_breakdown.length === 0) && (
                                                    <tr>
                                                        <td colSpan={3} className="text-center text-gray-500">No subscription data</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Monthly Trend */}
                                <div className="table-card">
                                    <div className="table-card-header">
                                        <h2>Monthly Trend</h2>
                                    </div>
                                    <div className="table-compact">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Month</th>
                                                    <th className="text-right">New Subscriptions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analytics?.monthly_trend.map((month) => (
                                                    <tr key={month.month}>
                                                        <td className="text-gray-900 font-medium">{month.month}</td>
                                                        <td className="text-right text-gray-900 font-semibold">{month.new_subscriptions}</td>
                                                    </tr>
                                                ))}
                                                {(!analytics?.monthly_trend || analytics.monthly_trend.length === 0) && (
                                                    <tr>
                                                        <td colSpan={2} className="text-center text-gray-500">No monthly data</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Never Subscribed */}
                            <div className="mt-6 table-card">
                                <div className="table-card-header">
                                    <h2>Never Subscribed</h2>
                                </div>
                                <div className="table-compact">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Category</th>
                                                <th className="text-right">Count</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="font-medium text-gray-900">Banks that registered but never started a subscription</td>
                                                <td className="text-right text-gray-900 font-semibold">{analytics?.never_subscribed || 0}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : activeTab === 'manage' ? (
                        <div className="space-y-6">
                            {/* Filter */}
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filterActive}
                                        onChange={(e) => {
                                            setFilterActive(e.target.checked);
                                        }}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm text-gray-700">Show only active subscriptions</span>
                                </label>
                            </div>

                            {/* Subscriptions Table */}
                            <div className="table-card">
                                <div className="table-card-header">
                                    <h2>All Subscriptions</h2>
                                </div>
                                <div className="table-compact">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Bank</th>
                                                <th>Tier</th>
                                                <th>Status</th>
                                                <th>Started</th>
                                                <th>Expires</th>
                                                <th>Donors</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subscriptions.map((sub) => (
                                                <tr key={sub.bank_id}>
                                                    <td>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{sub.bank_name}</p>
                                                            <p className="text-sm text-gray-500">{sub.bank_email}</p>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-info">{sub.subscription_tier || 'None'}</span>
                                                    </td>
                                                    <td>
                                                        {sub.is_subscribed ? (
                                                            sub.subscription_expires_at &&
                                                            new Date(sub.subscription_expires_at) < new Date() ? (
                                                                <span className="badge badge-danger">Expired</span>
                                                            ) : (
                                                                <span className="badge badge-success">Active</span>
                                                            )
                                                        ) : (
                                                            <span className="badge badge-warning">Inactive</span>
                                                        )}
                                                    </td>
                                                    <td className="text-gray-700">
                                                        {sub.subscription_started_at
                                                            ? new Date(sub.subscription_started_at).toLocaleDateString()
                                                            : 'N/A'}
                                                    </td>
                                                    <td className="text-gray-700">
                                                        {sub.subscription_expires_at
                                                            ? new Date(sub.subscription_expires_at).toLocaleDateString()
                                                            : 'N/A'}
                                                    </td>
                                                    <td className="text-gray-700">{sub.donor_count}</td>
                                                    <td>
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => router.push(`/banks/${sub.bank_id}`)}
                                                                className="btn-secondary text-sm"
                                                            >
                                                                View
                                                            </button>
                                                            {sub.is_subscribed && (
                                                                <button
                                                                    onClick={() => handleCancelSubscription(sub.bank_id, sub.bank_name)}
                                                                    className="btn-danger text-sm"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {subscriptions.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="text-center text-gray-500">No subscriptions found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Add New Plan Button */}
                            <div className="flex justify-end">
                                <button
                                    onClick={handleCreatePlan}
                                    className="btn-primary"
                                >
                                    + Create New Plan
                                </button>
                            </div>

                            {/* Plans Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {plans.map((plan) => (
                                    <div key={plan.id} className="table-card">
                                        {editingPlan?.id === plan.id ? (
                                            <div className="p-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name</label>
                                                        <input
                                                            type="text"
                                                            value={editingPlan.name}
                                                            onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                                            className="glass-input"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Price ($/month)</label>
                                                        <input
                                                            type="number"
                                                            value={editingPlan.price}
                                                            onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                                                            className="glass-input"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Donors</label>
                                                        <input
                                                            type="number"
                                                            value={editingPlan.max_donors || ''}
                                                            onChange={(e) => setEditingPlan({ ...editingPlan, max_donors: e.target.value ? parseInt(e.target.value) : null })}
                                                            className="glass-input"
                                                            placeholder="Unlimited"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                                        <textarea
                                                            value={editingPlan.description || ''}
                                                            onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                                                            className="glass-input"
                                                            rows={3}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={handleSavePlan} className="btn-primary flex-1">Save</button>
                                                        <button onClick={() => setEditingPlan(null)} className="btn-secondary flex-1">Cancel</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="table-card-header">
                                                    <h2>{plan.name}</h2>
                                                </div>
                                                <div className="p-6">
                                                    <div className="mb-4">
                                                        <div className="text-3xl font-bold text-blue-600 mb-1">
                                                            ${plan.price}
                                                            <span className="text-sm text-gray-500 font-normal">/month</span>
                                                        </div>
                                                        {plan.max_donors && (
                                                            <p className="text-sm text-gray-600">Up to {plan.max_donors} donors</p>
                                                        )}
                                                        {!plan.max_donors && (
                                                            <p className="text-sm text-gray-600">Unlimited donors</p>
                                                        )}
                                                    </div>
                                                    {plan.description && (
                                                        <p className="text-sm text-gray-700 mb-4">{plan.description}</p>
                                                    )}
                                                    {plan.features && plan.features.length > 0 && (
                                                        <div className="mb-4">
                                                            <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
                                                            <ul className="text-sm text-gray-600 space-y-1">
                                                                {plan.features.map((feature: string, index: number) => (
                                                                    <li key={index}>• {feature}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditPlan(plan)}
                                                            className="btn-secondary flex-1"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePlan(plan.id, plan.name)}
                                                            className="btn-danger flex-1"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {plans.length === 0 && (
                                    <div className="col-span-full text-center py-12 text-gray-500">
                                        No subscription plans found. Create one to get started.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </DashboardLayout>
    );
}
