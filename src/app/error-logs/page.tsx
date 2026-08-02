'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { toast } from 'sonner';
import api, { getApiErrorMessage } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Pagination } from '@/components/TablePrimitives';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Eye } from 'lucide-react';

interface ErrorLogItem {
    id: string;
    source: string;
    level: string;
    message: string;
    path: string | null;
    status_code: number | null;
    occurrence_count: number;
    first_seen_at: string;
    last_seen_at: string;
    resolved: boolean;
}

interface ErrorLogDetail extends ErrorLogItem {
    method: string | null;
    traceback: string | null;
    user_type: string | null;
    user_id: string | null;
}

interface ErrorLogListResponse {
    items: ErrorLogItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

const SOURCES = ['art-connect-backend', 'admin-backend', 'art-connect-frontend', 'admin-frontend'];

export default function ErrorLogsPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [source, setSource] = useState<string>('all');
    const [resolved, setResolved] = useState<string>('unresolved');
    const [detail, setDetail] = useState<ErrorLogDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const { data, isLoading, mutate } = useSWR<ErrorLogListResponse>(
        ['error-logs', page, source, resolved],
        () => api.getErrorLogs({
            page,
            source: source === 'all' ? undefined : source,
            resolved: resolved === 'all' ? undefined : resolved === 'resolved',
        }),
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

    const openDetail = async (id: string) => {
        setDetailLoading(true);
        try {
            const full = await api.getErrorLogDetail(id) as ErrorLogDetail;
            setDetail(full);
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        } finally {
            setDetailLoading(false);
        }
    };

    const handleResolve = async (id: string) => {
        try {
            await api.resolveErrorLog(id);
            mutate();
            setDetail(null);
            toast.success('Marked resolved');
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <DashboardLayout title="Error Logs" onRefresh={() => mutate()}>
            <div className="flex flex-wrap gap-3 mb-4">
                <Select value={source} onValueChange={(v) => { setSource(v); setPage(1); }}>
                    <SelectTrigger className="w-56">
                        <SelectValue placeholder="All sources" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All sources</SelectItem>
                        {SOURCES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={resolved} onValueChange={(v) => { setResolved(v); setPage(1); }}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="unresolved">Unresolved</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Source</TableHead>
                                <TableHead>Message</TableHead>
                                <TableHead>Count</TableHead>
                                <TableHead>Last seen</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                            ) : !data?.items?.length ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No errors — all clear.</TableCell></TableRow>
                            ) : (
                                data.items.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-mono text-xs">{log.source}</TableCell>
                                        <TableCell className="max-w-md truncate">{log.message}</TableCell>
                                        <TableCell>{log.occurrence_count}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(log.last_seen_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={log.resolved ? 'secondary' : 'destructive'}>
                                                {log.resolved ? 'Resolved' : 'Open'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="link" size="sm" onClick={() => openDetail(log.id)}>
                                                <Eye className="h-4 w-4" /> View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {data && data.total_pages > 1 && (
                <div className="mt-4">
                    <Pagination page={page} totalPages={data.total_pages} onPageChange={setPage} totalItems={data.total} />
                </div>
            )}

            <Dialog open={!!detail || detailLoading} onOpenChange={(open) => { if (!open) setDetail(null); }}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{detail?.source}</DialogTitle>
                        <DialogDescription>{detail?.message}</DialogDescription>
                    </DialogHeader>
                    {detail && (
                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                                <div>Path: <span className="text-foreground">{detail.path || '—'}</span></div>
                                <div>Method: <span className="text-foreground">{detail.method || '—'}</span></div>
                                <div>Status code: <span className="text-foreground">{detail.status_code ?? '—'}</span></div>
                                <div>Occurrences: <span className="text-foreground">{detail.occurrence_count}</span></div>
                                <div>First seen: <span className="text-foreground">{new Date(detail.first_seen_at).toLocaleString()}</span></div>
                                <div>Last seen: <span className="text-foreground">{new Date(detail.last_seen_at).toLocaleString()}</span></div>
                            </div>
                            {detail.traceback && (
                                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">{detail.traceback}</pre>
                            )}
                            {!detail.resolved && (
                                <Button onClick={() => handleResolve(detail.id)}>Mark resolved</Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
