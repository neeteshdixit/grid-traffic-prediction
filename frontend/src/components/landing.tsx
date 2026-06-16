'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Database,
  FileDown,
  Gauge,
  Layers3,
  MapPinned,
  ShieldCheck,
  Sparkles,
  SunMedium,
  MoonStar,
  Workflow,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import ParticlesBackdrop from './particles-backdrop';
import Reveal from './reveal';

interface LandingProps {
  onGoToLogin: () => void;
}

const featureCards = [
  {
    title: 'Dataset Studio',
    description: 'Upload train and test CSVs, inspect nulls, and profile geohash, time, and demand distributions in one place.',
    icon: Database,
  },
  {
    title: 'AutoML Champion',
    description: 'Compare Ridge, Random Forest, XGBoost, LightGBM, and CatBoost with geohash-aware grouped validation.',
    icon: Layers3,
  },
  {
    title: 'Explainability Layer',
    description: 'Expose global SHAP importance, local forecast drivers, and a clear reason trail for each prediction.',
    icon: Sparkles,
  },
  {
    title: 'Submission Flow',
    description: 'Generate the exact CSV format the hackathon judge expects, then export it from the console in one click.',
    icon: FileDown,
  },
];

const flowSteps = [
  {
    title: 'Ingest',
    value: 'train.csv / test.csv',
    description: 'Load the two datasets, validate the schema, and persist metadata for the dashboard.',
  },
  {
    title: 'Engineer',
    value: 'geohash + time + demand signals',
    description: 'Decode geohashes, encode time cycles, and build leakage-safe spatial features.',
  },
  {
    title: 'Train',
    value: '5-model cross-validation',
    description: 'Run grouped CV, rank by R2, and store the champion artifact with model metrics.',
  },
  {
    title: 'Predict',
    value: 'submission-ready CSV',
    description: 'Score the test set, clip predictions, and export the file for the leaderboard.',
  },
];

export default function Landing({ onGoToLogin }: LandingProps) {
  const { theme, toggleTheme } = useStore();
  const isDark = theme === 'dark';

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-[#050814] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <ParticlesBackdrop className="opacity-80" />

      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${isDark ? 'border-white/10 bg-[#050814]/78' : 'border-slate-200/80 bg-white/80'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button
            onClick={() => {
              const target = document.querySelector('#overview');
              target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="flex items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-sm font-black tracking-[0.18em] text-cyan-300">
              TA
            </span>
            <span className="text-left">
              <span className="block text-sm font-semibold tracking-[0.16em] text-cyan-300">TRAFFICAI</span>
              <span className={`block text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Demand prediction console
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            {[
              ['Overview', '#overview'],
              ['Pipeline', '#pipeline'],
              ['Metrics', '#metrics'],
              ['Security', '#security'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className={`transition hover:text-cyan-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition hover:border-cyan-400/30 ${
                isDark ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-white text-slate-700'
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? <SunMedium size={16} /> : <MoonStar size={16} />}
            </button>

            <button
              onClick={onGoToLogin}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/15 transition hover:scale-[1.02]"
            >
              Open Console
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      <section id="overview" className="relative mx-auto grid min-h-[92vh] max-w-7xl grid-cols-1 items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-16">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(6,182,212,0.08),transparent_26%),linear-gradient(90deg,rgba(139,92,246,0.07),transparent_24%)]" />

        <Reveal className="relative z-10 lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-300">
            <Gauge size={14} />
            Hackathon-ready traffic intelligence
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
            Predict traffic demand before the gridlock starts.
          </h1>

          <p className={`mt-5 max-w-2xl text-base leading-8 ${isDark ? 'text-slate-400' : 'text-slate-600'} sm:text-lg`}>
            Upload the Flipkart Gridlock datasets, train a champion model with spatial-temporal features, inspect SHAP
            explanations, and export a submission file that is ready for the leaderboard.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={onGoToLogin}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-cyan-500/10 transition hover:scale-[1.02] dark:bg-white"
            >
              Launch Dashboard
              <ArrowRight size={15} />
            </button>
            <a
              href="#pipeline"
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition hover:border-cyan-400/30 ${
                isDark ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              View pipeline
            </a>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Train rows', value: '77,299' },
              { label: 'Test rows', value: '41,778' },
              { label: 'Geohashes', value: '1,249' },
              { label: 'Model stages', value: '5' },
            ].map((item) => (
              <div key={item.label} className={`rounded-2xl border px-4 py-4 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
                <div className="mt-2 text-2xl font-black text-cyan-300">{item.value}</div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1} className="relative z-10 lg:col-span-5">
          <div className={`relative overflow-hidden rounded-3xl border ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-300" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
            </div>

            <div className="space-y-5 px-5 py-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Champion model</div>
                  <div className="mt-1 text-lg font-bold">LightGBM / CatBoost leaderboard</div>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Active
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'CV R2', value: 'best fold' },
                  { label: 'MAE', value: 'low error' },
                  { label: 'RMSE', value: 'stable peaks' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
                    <div className="mt-2 text-base font-semibold text-slate-100">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                  <span>Demand forecast preview</span>
                  <span>Day 49 • 02:15</span>
                </div>
                <div className="grid grid-cols-12 gap-1.5">
                  {[22, 28, 32, 40, 54, 48, 62, 66, 58, 73, 84, 78].map((value, index) => (
                    <div key={index} className="col-span-1 flex items-end">
                      <motion.div
                        animate={{ height: `${value}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut', delay: index * 0.03 }}
                        className="w-full rounded-t-md bg-gradient-to-t from-cyan-500 via-blue-500 to-violet-500"
                        style={{ minHeight: 26 }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MapPinned size={15} className="text-cyan-300" />
                    Geospatial demand
                  </div>
                  <p className="mt-2 text-xs leading-6 text-slate-400">
                    Location-aware demand shaping with decoded geohash coordinates and lane/road restrictions.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Workflow size={15} className="text-violet-300" />
                    Training workflow
                  </div>
                  <p className="mt-2 text-xs leading-6 text-slate-400">
                    Missing-value handling, grouped validation, and automatic model champion selection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="pipeline" className={`border-y ${isDark ? 'border-white/10 bg-[#07101f]' : 'border-slate-200 bg-white/70'}`}>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-2xl">
              <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Pipeline</div>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Everything the hackathon problem asks for, organized like a product.</h2>
            </div>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} delay={index * 0.05}>
                  <div className={`h-full rounded-3xl border p-5 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                      <Icon size={18} />
                    </div>
                    <h3 className="mt-4 text-lg font-bold">{feature.title}</h3>
                    <p className={`mt-2 text-sm leading-7 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{feature.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="metrics" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className={`rounded-3xl border p-6 lg:col-span-7 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
                <BarChart3 size={16} />
                Metric-first dashboard
              </div>
              <h3 className="mt-3 text-2xl font-black">Built to surface the numbers judges care about.</h3>
              <p className={`mt-3 max-w-2xl text-sm leading-7 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                The UI is centered on model leaderboard performance, validation scores, dataset health, and prediction export status,
                so you can explain the project clearly in a demo.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { label: 'Model leaderboard', detail: 'Compare Ridge, RF, XGBoost, LightGBM, CatBoost.' },
                  { label: 'Explainability', detail: 'Global SHAP and per-location explanation cards.' },
                  { label: 'Batch scoring', detail: 'Generate the exact CSV needed for submission.' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-bold">{item.label}</div>
                    <div className={`mt-2 text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-3xl border p-6 lg:col-span-5 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
                <ShieldCheck size={16} />
                Reliability and security
              </div>
              <div className="mt-4 space-y-4">
                {[
                  ['JWT auth', 'Protected API routes and authenticated dashboard flow.'],
                  ['Audit logs', 'Track dataset uploads, training, and predictions.'],
                  ['Responsive UI', 'Mobile drawer, desktop sidebar, and smooth transitions.'],
                  ['Performance', 'Compact loading states, lazy reveal, and low-overhead visuals.'],
                ].map(([title, description]) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold">{title}</div>
                    <p className={`mt-2 text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="security" className={`border-t ${isDark ? 'border-white/10 bg-[#07101f]' : 'border-slate-200 bg-white/70'}`}>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Reveal>
            <div className={`flex flex-col gap-4 rounded-3xl border p-6 md:flex-row md:items-center md:justify-between ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Ready for demo</div>
                <h3 className="mt-2 text-2xl font-black">Designed & built for a hackathon judge, but structured like a real product.</h3>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={onGoToLogin}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/10 transition hover:scale-[1.02]"
                >
                  Enter console
                  <ArrowRight size={15} />
                </button>
                <a
                  href="#overview"
                  className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition hover:border-cyan-400/30 ${
                    isDark ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  Back to top
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
