'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Building2, Users, CreditCard, RefreshCw, LogOut, ShieldCheck, Menu, X } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';

interface DashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
    actions?: React.ReactNode;
    onRefresh?: () => void;
}

const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Banks', path: '/banks', icon: Building2 },
    { name: 'Donors', path: '/donors', icon: Users },
    { name: 'Subscriptions', path: '/subscriptions', icon: CreditCard },
];

export default function DashboardLayout({ children, title, actions, onRefresh }: DashboardLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [adminName, setAdminName] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem('admin_token')) {
            router.replace('/login');
            return;
        }
        setIsAuthorized(true);
        const name = localStorage.getItem('admin_name');
        if (name) setAdminName(name);
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_name');
        localStorage.removeItem('admin_role');
        router.push('/login');
    };

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-secondary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`w-60 bg-secondary fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-7 h-7 text-white" />
                        <span className="text-lg font-semibold text-white">VeriART Admin</span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-1 text-white/70 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 py-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors border-l-[3px] ${
                                    isActive
                                        ? 'border-primary bg-white/10 text-primary'
                                        : 'border-transparent text-tertiary hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-secondary-dark flex items-center justify-center text-white text-sm font-semibold">
                            {adminName ? adminName.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{adminName || 'Admin'}</div>
                            <div className="text-xs text-tertiary">Administrator</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:ml-60 flex-1 min-h-screen bg-background">
                {title && (
                    <div className="sticky top-0 z-40 bg-card border-b border-border px-4 lg:px-8 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-muted-foreground hover:bg-muted rounded-lg">
                                <Menu className="w-5 h-5" />
                            </button>
                            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            {onRefresh && (
                                <button
                                    onClick={onRefresh}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                                    title="Refresh data"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Refresh
                                </button>
                            )}
                            {actions}
                        </div>
                    </div>
                )}
                {!title && (
                    <div className="lg:hidden sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-muted-foreground hover:bg-muted rounded-lg">
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                )}
                <div className="px-4 lg:px-8 py-6 max-w-[1600px] mx-auto">
                    <Breadcrumbs />
                    {children}
                </div>
            </div>
        </div>
    );
}
