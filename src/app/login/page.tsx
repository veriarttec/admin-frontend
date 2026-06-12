'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const SHOW_DEV_LOGIN = process.env.NEXT_PUBLIC_SHOW_DEV_LOGIN === 'true';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const fillDevCredentials = () => {
        setEmail('admin@artconnect.com');
        setPassword('Admin@2025');
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
        <div className="min-h-screen bg-[#FAFEFF] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <p className="text-2xl font-bold tracking-tight mb-3" style={{ fontFamily: 'var(--font-inter)', color: '#193A57' }}>
                        VeriART<span style={{ color: '#0FA4A6' }}>.</span>
                    </p>
                    <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-inter)', color: '#193A57' }}>
                        Admin Portal
                    </h1>
                    <p className="mt-2 text-sm opacity-70" style={{ color: '#494F55' }}>
                        Sign in to manage banks, donors and compliance
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#E8DDD2] overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: '#494F55' }} />

                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {SHOW_DEV_LOGIN && (
                    <button
                        type="button"
                        onClick={fillDevCredentials}
                        className="mb-3 w-full rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-2.5 text-sm text-yellow-800 hover:bg-yellow-100 transition-colors flex items-center justify-between"
                    >
                        <span>Auto-fill dev credentials</span>
                        <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </button>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#494F55' }}>
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-[#494F55] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#494F55] focus:border-transparent"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#494F55' }}>
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-11 rounded-lg border border-gray-300 text-[#494F55] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#494F55] focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    {showPassword ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    ) : (
                                        <circle cx="12" cy="12" r="3" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Forgot password */}
                    <div className="text-right">
                        <a
                            href="#"
                            className="text-sm text-[#0FA4A6] hover:underline"
                        >
                            Forgot password?
                        </a>
                    </div>

                    {/* CTA */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 w-full py-3 rounded-lg text-white text-sm font-semibold bg-[#193A57] hover:bg-[#102538] disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Signing in…' : 'Get Started'}
                    </button>
                </form>
                </div>
            </div>
        </div>
    );
}
