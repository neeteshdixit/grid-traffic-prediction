'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayCircle,
  Loader2,
  AlertCircle,
  UserCheck,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  Info,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Reveal from './reveal';

interface Hotspot {
  _id: string;
  cluster_id: number;
  latitude: number;
  longitude: number;
  geohash: string;
  location: string;
  police_station: string;
  junction_name: string;
  total_violations: number;
  growth_rate: number;
  hotspot_score: number;
  category: string;
  road_capacity_reduction: number;
  congestion_score: number;
  congestion_level: string;
  enforcement_priority: string;
  suggested_officers: number;
  expected_improvement_pct: number;
}

interface SimulationResult {
  violation_reduction_pct: number;
  congestion_reduction_pct: number;
  new_congestion_score: number;
  new_congestion_level: string;
  impact_status: string;
}

export default function EnforcementRecommendation() {
  const { token, theme } = useStore();
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClusterId, setSelectedClusterId] = useState<number | ''>('');
  const [officerCount, setOfficerCount] = useState(2);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{
    cluster_id: number;
    location: string;
    additional_officers: number;
    simulation: SimulationResult;
  } | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<string | null>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    async function fetchRecommendations() {
      setLoading(true);
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/parking/recommendations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setHotspots(data);
            if (data.length > 0) {
              setSelectedClusterId(data[0].cluster_id);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load enforcement recommendations:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchRecommendations();
  }, [token]);

  const selectedHotspot = useMemo(() => {
    if (selectedClusterId === '') return null;
    return hotspots.find((h) => h.cluster_id === selectedClusterId) || null;
  }, [hotspots, selectedClusterId]);

  // Run the simulation API call
  const handleSimulate = async () => {
    if (selectedClusterId === '') return;
    setSimulating(true);
    setDeploymentStatus(null);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/parking/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cluster_id: Number(selectedClusterId),
          additional_officers: officerCount,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setSimResult(result);
      }
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setSimulating(false);
    }
  };

  // Run automatic simulation when selection or count changes
  useEffect(() => {
    if (selectedClusterId !== '') {
      handleSimulate();
    }
  }, [selectedClusterId, officerCount]);

  const handleDeploy = () => {
    if (!selectedHotspot || !simResult) return;
    setDeploymentStatus('Deploying officers...');
    setTimeout(() => {
      setDeploymentStatus(`Success: ${officerCount} traffic officers deployed to ${selectedHotspot.location}. Expecting ${simResult.simulation.violation_reduction_pct}% decrease in wrong parking.`);
    }, 1200);
  };

  const downloadCSV = () => {
    if (hotspots.length === 0) return;
    const headers = ["Cluster ID", "Location", "Police Station", "Junction", "Total Violations", "Growth Rate", "Congestion Score", "Congestion Level", "Suggested Officers", "Expected Improvement"];
    const rows = hotspots.map(h => [
      h.cluster_id,
      `"${h.location.replace(/"/g, '""')}"`,
      h.police_station,
      h.junction_name,
      h.total_violations,
      h.growth_rate.toFixed(2),
      h.congestion_score,
      h.congestion_level,
      h.suggested_officers,
      `${h.expected_improvement_pct}%`
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `enforcement_recommendations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className={`flex flex-col items-center gap-3 rounded-3xl px-6 py-8 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
          <Loader2 className="animate-spin text-cyan-400" size={28} />
          <span className={`text-[11px] font-mono tracking-[0.24em] uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Prioritizing enforcement locations...
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
              <PlayCircle size={13} />
              Enforcement Strategy
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Smart Enforcement Studio</h1>
            <p className={`mt-2 max-w-2xl text-sm leading-7 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Optimize resources. Rank hotspots by congestion risk, view recommended traffic officers, and run simulated what-if deployments.
            </p>
          </div>
          <div className="shrink-0 pb-1">
            <button
              onClick={downloadCSV}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/20 px-4 py-2.5 text-xs font-bold text-cyan-300 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              Export Recommendations (CSV)
            </button>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        
        {/* Left Side: Priority Rank List */}
        <Reveal className="xl:col-span-7">
          <div className={`rounded-3xl border p-5 overflow-hidden ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
            <h3 className="text-sm font-bold mb-4">Priority Recommendations</h3>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
              {hotspots.slice(0, 10).map((h, i) => (
                <div
                  key={h.cluster_id}
                  onClick={() => setSelectedClusterId(h.cluster_id)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 transition cursor-pointer hover:scale-[1.01] ${
                    selectedClusterId === h.cluster_id
                      ? (isDark ? 'border-cyan-400/35 bg-cyan-500/10' : 'border-cyan-200 bg-cyan-50')
                      : (isDark ? 'border-white/5 bg-slate-900/40 hover:bg-slate-900/60' : 'border-slate-200 bg-white hover:bg-slate-100')
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                        h.enforcement_priority === 'Critical' ? 'bg-rose-500/20 text-rose-300' :
                        h.enforcement_priority === 'High' ? 'bg-rose-500/10 text-rose-300' :
                        h.enforcement_priority === 'Medium' ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'
                      }`}>
                        {h.enforcement_priority} Priority
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Cluster #{h.cluster_id}</span>
                    </div>
                    
                    <h4 className="text-xs font-bold leading-5 mt-1 truncate">{h.location}</h4>
                    <p className={`text-[10px] mt-0.5 truncate ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      {h.police_station} station • Junction: {h.junction_name}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4 border-white/10 shrink-0">
                    <div className="text-left sm:text-center">
                      <div className="text-[9px] uppercase tracking-wide text-slate-500">Deploy Officers</div>
                      <div className="flex items-center gap-1 mt-1 text-sm font-bold justify-start sm:justify-center">
                        <Users size={14} className="text-cyan-300" /> {h.suggested_officers}
                      </div>
                    </div>
                    <div className="text-left sm:text-center">
                      <div className="text-[9px] uppercase tracking-wide text-slate-500">Est. Improvement</div>
                      <div className="text-sm font-black text-cyan-300 mt-1">{h.expected_improvement_pct}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Right Side: Interactive Smart Simulator */}
        <div className="xl:col-span-5">
          <Reveal delay={0.04}>
            <div className={`rounded-3xl border p-5 space-y-5 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
              <div className="flex items-center gap-1.5 text-sm font-bold">
                <Sparkles size={15} className="text-cyan-300" />
                Smart Enforcement Simulator
              </div>
              <p className={`text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Estimate the direct effect of increasing police presence. Simulates congestion clearance and road capacity recovery.
              </p>

              {/* Selection inputs */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Select Hotspot</label>
                  <select
                    value={selectedClusterId}
                    onChange={(e) => setSelectedClusterId(e.target.value === '' ? '' : Number(e.target.value))}
                    className={`w-full rounded-2xl border px-3 py-2.5 text-xs ${
                      isDark ? 'border-white/10 bg-slate-900/60 text-slate-200' : 'border-slate-200 bg-white text-slate-950'
                    }`}
                  >
                    {hotspots.map((h) => (
                      <option key={h.cluster_id} value={h.cluster_id}>
                        {h.location.slice(0, 32)}... (Congestion: {h.congestion_score})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Deploy Officers</span>
                    <span className="font-bold text-cyan-300 font-mono">{officerCount} Officers</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    step="1"
                    value={officerCount}
                    onChange={(e) => setOfficerCount(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-semibold px-0.5">
                    <span>0 (None)</span>
                    <span>2 (Avg)</span>
                    <span>4 (High)</span>
                    <span>6 (Max)</span>
                  </div>
                </div>
              </div>

              {/* Simulation Result output */}
              <AnimatePresence mode="wait">
                {simResult ? (
                  <motion.div
                    key={`${selectedClusterId}-${officerCount}`}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className={`rounded-3xl p-5 border space-y-4 ${
                      simResult.simulation.new_congestion_level === 'Critical' || simResult.simulation.new_congestion_level === 'High'
                        ? 'bg-rose-500/5 border-rose-500/15'
                        : 'bg-emerald-500/5 border-emerald-500/15'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                      <span>Simulation Output</span>
                      {simulating && <Loader2 className="animate-spin text-cyan-300" size={13} />}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wide">Violation Reduction</div>
                        <div className="text-xl font-black text-emerald-400 mt-1 flex items-center gap-1">
                          <TrendingDown size={16} /> -{simResult.simulation.violation_reduction_pct}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wide">Congestion Clearance</div>
                        <div className="text-xl font-black text-cyan-300 mt-1">
                          -{simResult.simulation.congestion_reduction_pct}%
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block">New Congestion Score:</span>
                        <span className="font-bold">{simResult.simulation.new_congestion_score}/100</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Congestion Severity:</span>
                        <span className={`font-bold uppercase tracking-wider ${
                          simResult.simulation.new_congestion_level === 'Critical' ? 'text-rose-400' :
                          simResult.simulation.new_congestion_level === 'High' ? 'text-rose-300' :
                          simResult.simulation.new_congestion_level === 'Medium' ? 'text-amber-300' : 'text-emerald-400'
                        }`}>
                          {simResult.simulation.new_congestion_level}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 leading-5">
                      <Info size={14} className="shrink-0 text-cyan-300" />
                      <span>
                        Assigning **{officerCount} officers** will shift status to **"{simResult.simulation.impact_status}"**.
                      </span>
                    </div>

                    {/* Action button */}
                    <div className="border-t border-white/5 pt-3">
                      <button
                        onClick={handleDeploy}
                        className="w-full rounded-2xl bg-cyan-500 py-3 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
                      >
                        <UserCheck size={14} /> Deploy Enforcement Officers
                      </button>
                    </div>

                    {/* Deployment confirmation */}
                    {deploymentStatus && (
                      <div className={`rounded-xl border p-3 text-[10px] leading-5 flex items-start gap-2 ${
                        deploymentStatus.includes('Success') 
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' 
                          : 'border-white/10 bg-slate-900/60 text-slate-400'
                      }`}>
                        {deploymentStatus.includes('Success') ? (
                          <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                        ) : (
                          <Loader2 size={14} className="mt-0.5 shrink-0 animate-spin text-cyan-400" />
                        )}
                        <span>{deploymentStatus}</span>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="animate-spin text-cyan-400" />
                  </div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>

      </div>
    </div>
  );
}
