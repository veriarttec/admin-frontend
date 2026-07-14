'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { CreditCard } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

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
            <div className="relative">
                <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-lg">
                    <CreditCard className="w-12 h-12 text-muted-foreground/40 mb-3" />
                    <span className="text-lg font-semibold text-foreground">Coming Soon</span>
                    <span className="text-sm text-muted-foreground mt-1">Subscription management is under development</span>
                </div>
                <div className="pointer-events-none opacity-40">
                <div className="dashboard-container">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                        <TabsList>
                            <TabsTrigger value="analytics">Analytics</TabsTrigger>
                            <TabsTrigger value="manage">Manage Subscriptions ({subscriptions.length})</TabsTrigger>
                            <TabsTrigger value="plans">Subscription Plans ({plans.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="analytics">
                            {/* Summary Cards */}
                            <div className="stats-grid">
                                <Card className="h-full">
                                    <CardContent className="pt-6">
                                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Active Subscriptions</div>
                                        <div className="text-3xl font-bold text-green-600 mb-2">{analytics?.active_subscriptions || 0}</div>
                                    </CardContent>
                                </Card>
                                <Card className="h-full">
                                    <CardContent className="pt-6">
                                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Expiring Soon</div>
                                        <div className="text-3xl font-bold text-yellow-600 mb-2">{analytics?.expiring_soon || 0}</div>
                                        <div className="text-sm text-muted-foreground">Next 30 days</div>
                                    </CardContent>
                                </Card>
                                <Card className="h-full">
                                    <CardContent className="pt-6">
                                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Expired</div>
                                        <div className="text-3xl font-bold text-red-600 mb-2">{analytics?.expired || 0}</div>
                                    </CardContent>
                                </Card>
                                <Card className="h-full">
                                    <CardContent className="pt-6">
                                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Monthly Revenue</div>
                                        <div className="text-3xl font-bold text-secondary mb-2">
                                            ${(analytics?.total_revenue_estimate || 0).toLocaleString()}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="panels-grid">
                                {/* Tier Breakdown */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Tier Distribution</CardTitle>
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
                                                {analytics?.tier_breakdown.map((tier) => (
                                                    <TableRow key={tier.tier}>
                                                        <TableCell className="font-medium text-foreground">{tier.tier}</TableCell>
                                                        <TableCell className="text-foreground">{tier.count} {tier.count === 1 ? 'bank' : 'banks'}</TableCell>
                                                        <TableCell className="text-right">
                                                            <span className="text-green-600 font-semibold">${tier.revenue_estimate.toLocaleString()}</span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {(!analytics?.tier_breakdown || analytics.tier_breakdown.length === 0) && (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-center text-muted-foreground">No subscription data</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                {/* Monthly Trend */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Monthly Trend</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Month</TableHead>
                                                    <TableHead className="text-right">New Subscriptions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {analytics?.monthly_trend.map((month) => (
                                                    <TableRow key={month.month}>
                                                        <TableCell className="text-foreground font-medium">{month.month}</TableCell>
                                                        <TableCell className="text-right text-foreground font-semibold">{month.new_subscriptions}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {(!analytics?.monthly_trend || analytics.monthly_trend.length === 0) && (
                                                    <TableRow>
                                                        <TableCell colSpan={2} className="text-center text-muted-foreground">No monthly data</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Never Subscribed */}
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Never Subscribed</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Category</TableHead>
                                                <TableHead className="text-right">Count</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="font-medium text-foreground">Banks that registered but never started a subscription</TableCell>
                                                <TableCell className="text-right text-foreground font-semibold">{analytics?.never_subscribed || 0}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="manage">
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
                                        <span className="text-sm text-foreground">Show only active subscriptions</span>
                                    </label>
                                </div>

                                {/* Subscriptions Table */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>All Subscriptions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Bank</TableHead>
                                                    <TableHead>Tier</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Started</TableHead>
                                                    <TableHead>Expires</TableHead>
                                                    <TableHead>Donors</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {subscriptions.map((sub) => (
                                                    <TableRow key={sub.bank_id}>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium text-foreground">{sub.bank_name}</p>
                                                                <p className="text-sm text-muted-foreground">{sub.bank_email}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary">{sub.subscription_tier || 'None'}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <StatusBadge status={
                                                                !sub.is_subscribed ? 'inactive' :
                                                                sub.subscription_expires_at && new Date(sub.subscription_expires_at) < new Date() ? 'expired' :
                                                                'active'
                                                            } />
                                                        </TableCell>
                                                        <TableCell className="text-foreground">
                                                            {sub.subscription_started_at
                                                                ? new Date(sub.subscription_started_at).toLocaleDateString()
                                                                : 'N/A'}
                                                        </TableCell>
                                                        <TableCell className="text-foreground">
                                                            {sub.subscription_expires_at
                                                                ? new Date(sub.subscription_expires_at).toLocaleDateString()
                                                                : 'N/A'}
                                                        </TableCell>
                                                        <TableCell className="text-foreground">{sub.donor_count}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    onClick={() => router.push(`/banks/${sub.bank_id}`)}
                                                                >
                                                                    View
                                                                </Button>
                                                                {sub.is_subscribed && (
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        onClick={() => handleCancelSubscription(sub.bank_id, sub.bank_name)}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {subscriptions.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center text-muted-foreground">No subscriptions found</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="plans">
                            <div className="space-y-6">
                                {/* Add New Plan Button */}
                                <div className="flex justify-end">
                                    <Button onClick={handleCreatePlan}>
                                        + Create New Plan
                                    </Button>
                                </div>

                                {/* Plans Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {plans.map((plan) => (
                                        <Card key={plan.id}>
                                            {editingPlan?.id === plan.id ? (
                                                <CardContent className="pt-6">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label className="mb-2">Plan Name</Label>
                                                            <Input
                                                                type="text"
                                                                value={editingPlan.name}
                                                                onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="mb-2">Price ($/month)</Label>
                                                            <Input
                                                                type="number"
                                                                value={editingPlan.price}
                                                                onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="mb-2">Max Donors</Label>
                                                            <Input
                                                                type="number"
                                                                value={editingPlan.max_donors || ''}
                                                                onChange={(e) => setEditingPlan({ ...editingPlan, max_donors: e.target.value ? parseInt(e.target.value) : null })}
                                                                placeholder="Unlimited"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="mb-2">Description</Label>
                                                            <Textarea
                                                                value={editingPlan.description || ''}
                                                                onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                                                                rows={3}
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button onClick={handleSavePlan} className="flex-1">Save</Button>
                                                            <Button variant="secondary" onClick={() => setEditingPlan(null)} className="flex-1">Cancel</Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            ) : (
                                                <>
                                                    <CardHeader>
                                                        <CardTitle>{plan.name}</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="mb-4">
                                                            <div className="text-3xl font-bold text-secondary mb-1">
                                                                ${plan.price}
                                                                <span className="text-sm text-muted-foreground font-normal">/month</span>
                                                            </div>
                                                            {plan.max_donors && (
                                                                <p className="text-sm text-muted-foreground">Up to {plan.max_donors} donors</p>
                                                            )}
                                                            {!plan.max_donors && (
                                                                <p className="text-sm text-muted-foreground">Unlimited donors</p>
                                                            )}
                                                        </div>
                                                        {plan.description && (
                                                            <p className="text-sm text-foreground mb-4">{plan.description}</p>
                                                        )}
                                                        {plan.features && plan.features.length > 0 && (
                                                            <div className="mb-4">
                                                                <p className="text-sm font-medium text-foreground mb-2">Features:</p>
                                                                <ul className="text-sm text-muted-foreground space-y-1">
                                                                    {plan.features.map((feature: string, index: number) => (
                                                                        <li key={index}>• {feature}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="secondary"
                                                                onClick={() => handleEditPlan(plan)}
                                                                className="flex-1"
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                onClick={() => handleDeletePlan(plan.id, plan.name)}
                                                                className="flex-1"
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </>
                                            )}
                                        </Card>
                                    ))}
                                    {plans.length === 0 && (
                                        <div className="col-span-full text-center py-12 text-muted-foreground">
                                            No subscription plans found. Create one to get started.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
