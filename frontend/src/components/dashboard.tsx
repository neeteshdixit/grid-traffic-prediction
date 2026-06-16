'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bot,
  CheckCircle2,
  FileDown,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useStore } from '../store/useStore';
import Reveal from './reveal';

type LeaderboardItem = {
  id: string;
  name: string;
  algorithm: string;
  r2_score: number;
  mae: number;
  rmse: number;
  is_active: boolean;
  metrics_metadata?: {
    metrics?: Record<string, { r2: number; mae: number; rmse: number }>;
    shap_importance?: Record<string, number>;
  };
};

export default function Dashboard() {
  const { token, theme } = useStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [datasetRows, setDatasetRows] = useState<any[]>([]);
  const [predictionRows, setPredictionRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGeohash, setSelectedGeohash] = useState('qp02z1');

  const isDark = theme === 'dark';

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);

      try {
        const [modelsResponse, datasetsResponse, predictionsResponse] = await Promise.all([
          fetch('http://localhost:8000/api/v1/models/leaderboard', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:8000/api/v1/datasets', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:8000/api/v1/predictions', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const modelsData = await modelsResponse.json();
        const datasetsData = await datasetsResponse.json();
        const predictionsData = await predictionsResponse.json();

        if (Array.isArray(modelsData)) setLeaderboard(modelsData);
        if (Array.isArray(datasetsData)) setDatasetRows(datasetsData);
        if (Array.isArray(predictionsData)) setPredictionRows(predictionsData);
      } catch (error) {
        console.error('Dashboard data loading failed:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [token]);

  const champion = leaderboard[0];
  const championMetrics = champion?.metrics_metadata?.metrics?.[champion?.algorithm];
  const shapImportance = champion?.metrics_metadata?.shap_importance || {};

  const summaryCards = useMemo(
    () => [
      {
        label: 'Active model',
        value: champion?.name || 'LightGBM Champion',
        detail: champion?.algorithm || 'Auto-selected champion',
        icon: Bot,
      },
      {
        label: 'Validation R2',
        value: champion ? champion.r2_score.toFixed(4) : '—',
        detail: championMetrics ? 'Cross-validated across geohash groups' : 'Awaiting model run',
        icon: TrendingUp,
      },
      {
        label: 'MAE / RMSE',
        value: champion ? `${champion.mae.toFixed(4)} / ${champion.rmse.toFixed(4)}` : '—',
        detail: championMetrics ? 'Lower is better for stable demand' : 'Batch metrics unavailable',
        icon: BarChart3,
      },
      {
        label: 'Datasets',
        value: datasetRows.length.toString().padStart(2, '0'),
        detail: 'Training and test uploads tracked',
        icon: Activity,
      },
      {
        label: 'Prediction runs',
        value: predictionRows.length.toString().padStart(2, '0'),
        detail: 'Export-ready submissions',
        icon: FileDown,
      },
      {
        label: 'Coverage',
        value: '1,249 geohashes',
        detail: 'High overlap between train and test',
        icon: MapPin,
      },
    ],
    [champion, championMetrics, datasetRows.length, predictionRows.length]
  );

  const demandTrend = [
    { slot: '00:00', demand: 0.12 },
    { slot: '04:00', demand: 0.08 },
    { slot: '08:00', demand: 0.74 },
    { slot: '12:00', demand: 0.51 },
    { slot: '16:00', demand: 0.86 },
    { slot: '20:00', demand: 0.43 },
    { slot: '23:45', demand: 0.19 },
  ];

  const weatherImpact = [
    { weather: 'Sunny', demand: 0.38 },
    { weather: 'Rainy', demand: 0.63 },
    { weather: 'Foggy', demand: 0.57 },
    { weather: 'Snowy', demand: 0.48 },
  ];

  const roadTypeData = [
    { name: 'Residential', value: 48, color: '#06b6d4' },
    { name: 'Street', value: 28, color: '#8b5cf6' },
    { name: 'Highway', value: 24, color: '#22c55e' },
  ];

  const heatmapNodes = [
    { id: 'qp02z1', intensity: 'High', tone: 'text-rose-300 border-rose-400/20 bg-rose-500/10' },
    { id: 'qp02zt', intensity: 'Medium', tone: 'text-amber-300 border-amber-400/20 bg-amber-500/10' },
    { id: 'qp08b0', intensity: 'Low', tone: 'text-emerald-300 border-emerald-400/20 bg-emerald-500/10' },
    { id: 'qp08gt', intensity: 'High', tone: 'text-rose-300 border-rose-400/20 bg-rose-500/10' },
    { id: 'qp02zq', intensity: 'Low', tone: 'text-emerald-300 border-emerald-400/20 bg-emerald-500/10' },
    { id: 'qp02z9', intensity: 'Medium', tone: 'text-amber-300 border-amber-400/20 bg-amber-500/10' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className={`flex flex-col items-center gap-3 rounded-3xl px-6 py-8 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
          <Loader2 className="animate-spin text-cyan-400" size={28} />
          <span className={`text-[11px] font-mono tracking-[0.24em] uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Loading dashboard telemetry...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-300">
              <Sparkles size={13} />
              Traffic prediction workspace
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Overview dashboard</h1>
            <p className={`mt-2 max-w-2xl text-sm leading-7 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Track the champion model, inspect dataset health, and export predictions without leaving the console.
            </p>
          </div>

          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
            isDark ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}>
            <ShieldCheck size={15} />
            System healthy
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Reveal key={card.label} delay={index * 0.03}>
              <div className={`rounded-3xl border p-5 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{card.label}</div>
                    <div className="mt-2 text-xl font-bold">{card.value}</div>
                    <p className={`mt-2 text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{card.detail}</p>
                  </div>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                    <Icon size={18} />
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Reveal className="xl:col-span-7">
          <div className={`rounded-3xl border p-5 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
            <div>
              <h3 className="text-sm font-bold">Daily demand trend preview</h3>
              <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Hourly traffic demand pattern used as the landing-dashboard visual anchor.
              </p>
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demandTrend} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={isDark ? '#1f2937' : '#e2e8f0'} strokeDasharray="3 3" />
                  <XAxis dataKey="slot" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} domain={[0, 1]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0b1220' : '#ffffff',
                      borderColor: isDark ? '#1f2937' : '#e2e8f0',
                    }}
                  />
                  <Area type="monotone" dataKey="demand" stroke="#06b6d4" strokeWidth={2} fill="url(#demandGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.04} className="xl:col-span-5">
          <div className={`rounded-3xl border p-5 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
            <div>
              <h3 className="text-sm font-bold">Champion model comparison</h3>
              <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                The best model wins the leaderboard and drives batch scoring.
              </p>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className={isDark ? 'bg-slate-900/70 text-slate-400' : 'bg-slate-50 text-slate-500'}>
                  <tr>
                    <th className="px-4 py-3 font-semibold">Model</th>
                    <th className="px-4 py-3 font-semibold">R2</th>
                    <th className="px-4 py-3 font-semibold">MAE</th>
                  </tr>
                </thead>
                <tbody>
                  {(leaderboard.length ? leaderboard : []).map((model) => (
                    <tr
                      key={model.id}
                      className={`border-t ${isDark ? 'border-white/5' : 'border-slate-200'} ${
                        model.is_active ? (isDark ? 'bg-cyan-500/5' : 'bg-cyan-50') : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold">{model.algorithm}</div>
                        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{model.name}</div>
                      </td>
                      <td className="px-4 py-3 font-mono">{model.r2_score.toFixed(4)}</td>
                      <td className="px-4 py-3 font-mono">{model.mae.toFixed(4)}</td>
                    </tr>
                  ))}
                  {!leaderboard.length && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                        No leaderboard data yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Reveal className="xl:col-span-5">
          <div className={`rounded-3xl border p-5 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
            <h3 className="text-sm font-bold">Road type split</h3>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roadTypeData} dataKey="value" cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={4}>
                    {roadTypeData.map((entry, index) => (
                      <Cell key={`road-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.05} className="xl:col-span-4">
          <div className={`rounded-3xl border p-5 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
            <h3 className="text-sm font-bold">Weather correlation</h3>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weatherImpact} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={isDark ? '#1f2937' : '#e2e8f0'} strokeDasharray="3 3" />
                  <XAxis dataKey="weather" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} domain={[0, 1]} />
                  <Tooltip />
                  <Bar dataKey="demand" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="xl:col-span-3">
          <div className={`rounded-3xl border p-5 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
            <h3 className="text-sm font-bold">Hot geohashes</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {heatmapNodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => setSelectedGeohash(node.id)}
                  className={`rounded-2xl border px-3 py-3 text-left text-xs transition hover:scale-[1.02] ${node.tone} ${
                    selectedGeohash === node.id ? 'ring-2 ring-cyan-400/40' : ''
                  }`}
                >
                  <div className="font-mono font-semibold">{node.id}</div>
                  <div className="mt-1 opacity-80">{node.intensity} demand</div>
                </button>
              ))}
            </div>
            <div className={`mt-4 flex items-start gap-2 rounded-2xl border px-3 py-3 text-xs ${isDark ? 'border-white/10 bg-white/5 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-cyan-300" />
              <span>
                Selected node <span className="font-semibold text-cyan-300">{selectedGeohash}</span> is used for local
                inspection and quick what-if analysis.
              </span>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal>
        <div className={`rounded-3xl border p-5 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
          <div className="flex items-center gap-2 text-sm font-bold">
            <Sparkles size={15} className="text-cyan-300" />
            Global SHAP top drivers
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(shapImportance)
              .slice(0, 8)
              .map(([feature, value]) => (
                <span
                  key={feature}
                  className={`rounded-full border px-3 py-2 text-xs ${
                    isDark ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <span className="font-semibold">{feature}</span>
                  <span className="ml-2 text-cyan-300">{Number(value).toFixed(3)}</span>
                </span>
              ))}
            {!Object.keys(shapImportance).length && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
                SHAP data will appear after the next training run.
              </span>
            )}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

