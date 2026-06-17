'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Loader2, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import ParticlesBackdrop from './particles-backdrop';

interface LoginProps {
  onBackToLanding: () => void;
}

export default function Login({ onBackToLanding }: LoginProps) {
  const { setToken, setUser, theme } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isDark = theme === 'dark';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setToken(data.access_token);

        const profileResponse = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        const profile = await profileResponse.json();
        setUser(profile);
      } else {
        setError(data.detail || 'Invalid email or password');
      }
    } catch (err) {
      setError('Connection refused. Please confirm the FastAPI backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 ${isDark ? 'bg-[#050814] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <ParticlesBackdrop className="opacity-75" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className={`relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[28px] border lg:grid-cols-2 ${
          isDark ? 'glass-card-dark' : 'glass-card-light'
        }`}
      >
        <div className="hidden flex-col justify-between border-r border-white/10 p-8 lg:flex">
          <div>
            <button onClick={onBackToLanding} className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
              <ArrowLeft size={15} />
              Back to overview
            </button>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-300">
              <Sparkles size={13} />
              Secure access
            </div>

            <h1 className="mt-5 max-w-md text-4xl font-black leading-tight tracking-tight">
              Enter the traffic prediction console.
            </h1>
            <p className={`mt-4 max-w-lg text-sm leading-7 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Use the workspace to upload datasets, run grouped cross-validation, review explainability, and export
              submission files from a single production-style interface.
            </p>
          </div>

          <div className="space-y-3">
            {[
              ['JWT authentication', 'Every dashboard route is protected by a signed token.'],
              ['Audit trail', 'Uploads, training, and scoring actions are tracked.'],
              ['Champion model', 'The best model is auto-selected from grouped CV results.'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck size={15} className="text-emerald-300" />
                  {title}
                </div>
                <p className={`mt-2 text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="flex items-center justify-between gap-4 lg:hidden">
            <button onClick={onBackToLanding} className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300">
              <ArrowLeft size={15} />
              Back
            </button>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">TrafficAI</div>
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Demand prediction console</div>
            </div>
          </div>

          <div className="mt-6 lg:mt-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-300">
              <Sparkles size={13} />
              Sign in to continue
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight">Welcome back.</h2>
            <p className={`mt-2 text-sm leading-7 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Log in with the seeded demo account and explore the full workflow.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className={`mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Corporate email
              </span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="scientist@traffic.ai"
                  className={`w-full rounded-2xl border px-10 py-3 text-sm transition ${
                    isDark
                      ? 'border-white/10 bg-slate-950/60 text-slate-100 placeholder:text-slate-500'
                      : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
                  }`}
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className={`mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Password
              </span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="SecurePassword123!"
                  className={`w-full rounded-2xl border px-10 py-3 text-sm transition ${
                    isDark
                      ? 'border-white/10 bg-slate-950/60 text-slate-100 placeholder:text-slate-500'
                      : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
                  }`}
                  required
                />
              </div>
            </label>

            {error && (
              <div className="flex gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/15 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Enter dashboard'
              )}
            </button>
          </form>

          <div className={`mt-8 rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
            <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-300">Demo credentials</div>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className="font-semibold">scientist@traffic.ai</span> / <span className="font-semibold">SecurePassword123!</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

