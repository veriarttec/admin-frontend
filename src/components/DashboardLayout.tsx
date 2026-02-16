'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
    actions?: React.ReactNode;
    onRefresh?: () => void; // Optional refresh callback for pages
}

export default function DashboardLayout({ children, title, actions, onRefresh }: DashboardLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [adminName, setAdminName] = useState('');

    useEffect(() => {
        const name = localStorage.getItem('admin_name');
        if (name) setAdminName(name);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_name');
        localStorage.removeItem('admin_role');
        router.push('/login');
    };

    const navItems = [
        {
            name: 'Dashboard',
            path: '/dashboard',
            icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            name: 'Banks',
            path: '/banks',
            icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
        },
        {
            name: 'Donors',
            path: '/donors',
            icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },

        {
            name: 'Subscriptions',
            path: '/subscriptions',
            icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>ArtPriv Admin</span>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <a
                            key={item.path}
                            href={item.path}
                            className={`sidebar-link ${pathname === item.path ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </a>
                    ))}
                </nav>

                <div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: '600' }}>
                            {adminName ? adminName.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: 'white', fontSize: '14px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {adminName || 'Admin'}
                            </div>
                            <div style={{ color: 'var(--sidebar-text)', fontSize: '12px' }}>Administrator</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-content">
                {title && (
                    <div className="page-header">
                        <h1 className="page-title">{title}</h1>
                        <div className="page-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {onRefresh && (
                                <button
                                    onClick={onRefresh}
                                    className="btn-secondary"
                                    title="Refresh data"
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Refresh
                                </button>
                            )}
                            {actions}
                        </div>
                    </div>
                )}
                <div style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
