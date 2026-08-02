'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import api, { getApiErrorMessage } from '@/lib/api';
import { useConfirm } from '@/components/ConfirmDialog';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SystemSettings {
    maintenance_mode: boolean;
    maintenance_message: string | null;
    enabled_at: string | null;
    updated_by: string | null;
}

export default function SettingsPage() {
    const confirm = useConfirm();
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    useEffect(() => {
        setIsSuperAdmin(localStorage.getItem('admin_role') === 'super_admin');
    }, []);

    const { data: settings, isLoading, mutate } = useSWR<SystemSettings>(
        'system-settings',
        () => api.getSystemSettings(),
        { refreshInterval: 30_000 }
    );

    const handleEnableMaintenance = async () => {
        const message = await confirm({
            title: 'Enable maintenance mode?',
            description: 'The public site (veriart-tec.in) will immediately show a maintenance page to every visitor and reject all API requests. The admin panel is not affected.',
            destructive: true,
            confirmLabel: 'Enable',
            input: { label: 'Message shown to visitors (optional)', multiline: true },
        }) as string | null;
        if (message === null) return;
        try {
            await api.setMaintenanceMode(true, message || undefined);
            mutate();
            toast.success('Maintenance mode enabled');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    const handleDisableMaintenance = async () => {
        if (!(await confirm({
            title: 'Disable maintenance mode?',
            confirmLabel: 'Disable',
        }))) return;
        try {
            await api.setMaintenanceMode(false);
            mutate();
            toast.success('Maintenance mode disabled');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <DashboardLayout title="Settings">
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        Maintenance Mode
                        {!isLoading && settings && (
                            <Badge variant={settings.maintenance_mode ? 'destructive' : 'secondary'}>
                                {settings.maintenance_mode ? 'Offline' : 'Online'}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Takes the main app (donor, bank, and patient portals) offline with a friendly
                        &quot;back soon&quot; page, and blocks its API. This admin panel always stays reachable.
                    </p>
                    {settings?.maintenance_mode && settings.maintenance_message && (
                        <div className="p-3 bg-muted rounded-lg text-sm">
                            <span className="font-medium">Visitor message:</span> {settings.maintenance_message}
                        </div>
                    )}
                    {isSuperAdmin ? (
                        settings?.maintenance_mode ? (
                            <Button onClick={handleDisableMaintenance}>Bring app online</Button>
                        ) : (
                            <Button variant="destructive" onClick={handleEnableMaintenance}>
                                Take app offline
                            </Button>
                        )
                    ) : (
                        <p className="text-xs text-muted-foreground">Only super admins can change this.</p>
                    )}
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
