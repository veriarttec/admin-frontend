'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Star } from 'lucide-react';

const SHOW_DEV_LOGIN = process.env.NEXT_PUBLIC_SHOW_DEV_LOGIN === 'true';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const msg = sessionStorage.getItem('admin_session_message');
        if (msg) {
            sessionStorage.removeItem('admin_session_message');
            setError(msg);
        }
    }, []);

    // Values come from env so production bundles never contain credentials
    const fillDevCredentials = () => {
        setEmail(process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL || '');
        setPassword(process.env.NEXT_PUBLIC_DEV_LOGIN_PASSWORD || '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.login({ email, password });
            localStorage.setItem('admin_name', response.name);
            localStorage.setItem('admin_role', response.role);
            router.push('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <p className="text-2xl font-bold tracking-tight mb-3 font-[var(--font-inter)] text-primary">
                        VeriART<span className="text-secondary">.</span>
                    </p>
                    <h1 className="text-2xl font-bold font-[var(--font-inter)] text-primary">
                        Admin Portal
                    </h1>
                    <p className="mt-2 text-sm text-foreground opacity-70">
                        Sign in to manage banks, donors and compliance
                    </p>
                </div>

                <Card className="rounded-2xl shadow-xl border-border overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-primary" />
                    <CardContent className="p-8">
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {SHOW_DEV_LOGIN && (
                            <button
                                type="button"
                                onClick={fillDevCredentials}
                                className="mb-3 w-full rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-2.5 text-sm text-yellow-800 hover:bg-yellow-100 transition-colors flex items-center justify-between"
                            >
                                <span>Auto-fill dev credentials</span>
                                <Star className="w-4 h-4 text-purple-500" />
                            </button>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email */}
                            <div>
                                <Label htmlFor="email" className="mb-2 text-foreground">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <Label htmlFor="password" className="mb-2 text-foreground">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pr-11"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Forgot password */}
                            <div className="text-right">
                                <a
                                    href={`${process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://veriart-tec.in'}/forgot-password?type=admin`}
                                    className="text-sm text-secondary hover:underline"
                                >
                                    Forgot password?
                                </a>
                            </div>

                            {/* CTA */}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="mt-2 w-full py-3"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
