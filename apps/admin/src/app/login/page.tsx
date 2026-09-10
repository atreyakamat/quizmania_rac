'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

import { getSafeRedirectUrl } from '@/lib/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = getSafeRedirectUrl(searchParams.get('next'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      // Successfully authenticated & authorized -> redirect to verified safe path
      router.replace(nextUrl);
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
      setError('Network or server error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#180A12] border border-[#301322] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2 pb-4 mb-6 border-b border-[#301322] text-slate-200">
        <ShieldCheck className="w-5 h-5 text-[#D83B70]" />
        <h2 className="font-semibold text-sm">Administrator Sign In</h2>
      </div>

      {process.env.NODE_ENV !== 'production' && (
        <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-200 text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-amber-300">Local Dev Account:</span>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@quizmania.dev');
                setPassword('admin123');
              }}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-medium text-[11px] transition-colors"
            >
              Quick Auto-fill
            </button>
          </div>
          <div className="text-[11px] text-amber-300/80 font-mono">
            admin@quizmania.dev (any password)
          </div>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Admin Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@rotaractmapusa.org"
              required
              autoFocus
              disabled={loading}
              className="w-full pl-9 pr-3 py-2.5 bg-[#10060C] border border-[#301322] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#D83B70] focus:ring-1 focus:ring-[#D83B70] transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={loading}
              className="w-full pl-9 pr-3 py-2.5 bg-[#10060C] border border-[#301322] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#D83B70] focus:ring-1 focus:ring-[#D83B70] transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#A50D52] to-[#D83B70] text-white text-sm font-semibold shadow-lg shadow-[#A50D52]/30 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In to Admin Studio</span>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-[#301322]/80 text-center">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Authorized administrators only. Session tokens are protected via secure HttpOnly authentication.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#10060C] flex flex-col justify-center items-center px-4 py-12 selection:bg-[#D83B70] selection:text-white">
      {/* Background glowing gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#A50D52]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#D83B70]/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 p-2.5 border border-[#D83B70]/40 shadow-xl shadow-[#A50D52]/30 mb-4">
            <Image
              src="/branding/quizmania.png"
              alt="QuizMania Logo"
              width={64}
              height={64}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">QUIZMANIA</h1>
          <p className="text-xs font-semibold text-[#D83B70] uppercase tracking-wider mt-0.5">
            Admin Studio
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Rotaract Club of Mapusa
          </p>
        </div>

        {/* Suspense-wrapped Login Form */}
        <Suspense
          fallback={
            <div className="bg-[#180A12] border border-[#301322] rounded-2xl p-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#D83B70]" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
