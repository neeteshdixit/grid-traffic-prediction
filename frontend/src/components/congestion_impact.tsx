'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  ShieldAlert,
  Loader2,
  AlertTriangle,
  Sparkles,
  Info,
  Layers,
  MapPin,
  TrendingDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
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

interface CongestionStats {
  total_hotspots: number;
  average_congestion_score: number;
  level_counts: Record<string, number>;
  average_capacity_reduction: number;
  hotspots: any[];
}

export default function CongestionImpact() {
  const { token, theme } = useStore();
  const [data, setData] = useState<CongestionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [whatIfViolation, setWhatIfViolation] = useState('NO PARKING');
  const [whatIfVehicle, setWhatIfVehicle] = useState('CAR');

  const isDark = theme === 'dark';

  useEffect(() => {
    async function fetchCongestionData() {
      setLoading(true);
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/parking/congestion', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to load congestion stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCongestionData();
  }, [token]);

  // Aggregate vehicle statistics across all hotspots
  const vehicleDistribution = useMemo(() => {
    if (!data || !data.hotspots.length) return [];
    const totals: Record<string, number> = { SCOOTER: 0, CAR: 0, 'PASSENGER AUTO': 0, 'GOODS AUTO': 0, LGV: 0, 'PRIVATE BUS': 0 };
    
    data.hotspots.forEach((h) => {
      Object.entries(h.vehicle_distribution || {}).forEach(([name, count]) => {
        if (typeof count === 'number') {
          if (name.includes('SCOOTER') || name.includes('CYCLE') || name.includes('MOPED')) {
            totals['SCOOTER'] += count;
          } else if (name.includes('CAR') || name.includes('CAB')) {
            totals['CAR'] += count;
          } else if (name.includes('PASSENGER')) {
            totals['PASSENGER AUTO'] += count;
          } else if (name.includes('GOODS') || name.includes('THREE WHEELER')) {
            totals['GOODS AUTO'] += count;
          } else if (name.includes('BUS')) {
            totals['PRIVATE BUS'] += count;
          } else {
            totals['LGV'] += count;
          }
        }
      });
    });

    const colors = ['#06b6d4', '#2563eb', '#8b5cf6', '#eab308', '#f97316', '#ef4444'];
    return Object.entries(totals)
      .map(([name, value], i) => ({
        name,
        value,
        color: colors[i % colors.length],
      }))
      .filter((item) => item.value > 0);
  }, [data]);

  // Police Station congestion rank
  const stationRankData = useMemo(() => {
    if (!data || !data.hotspots.length) return [];
    const stationScores: Record<string, { total: number; count: number }> = {};
    
    data.hotspots.forEach((h) => {
      const ps = h.police_station;
      if (!stationScores[ps]) stationScores[ps] = { total: 0, count: 0 };
      stationScores[ps].total += h.congestion_score;
      stationScores[ps].count += 1;
    });

    return Object.entries(stationScores)
      .map(([name, item]) => ({
        name: name.replace(' Police Station', '').replace(' Traffic', ''),
        avgScore: Math.round(item.total / item.count),
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 8);
  }, [data]);

  // What-If Calculator calculation
  const whatIfResult = useMemo(() => {
    let baseDrop = 15; // baseline capacity drop %
    if (whatIfViolation === 'WRONG PARKING') baseDrop += 10;
    if (whatIfViolation === 'PARKING IN A MAIN ROAD') baseDrop += 25;
    if (whatIfViolation === 'DOUBLE PARKING') baseDrop += 35;
    
    let multiplier = 1.0;
    if (whatIfVehicle === 'SCOOTER') multiplier = 0.5;
    if (whatIfVehicle === 'CAR') multiplier = 1.2;
    if (whatIfVehicle === 'PASSENGER AUTO') multiplier = 1.0;
    if (whatIfVehicle === 'PRIVATE BUS' || whatIfVehicle === 'LGV') multiplier = 2.2;
    
    const finalDrop = Math.min(95, Math.round(baseDrop * multiplier));
    
    let riskLevel = 'Low';
    if (finalDrop >= 70) riskLevel = 'Critical';
    else if (finalDrop >= 50) riskLevel = 'High';
    else if (finalDrop >= 30) riskLevel = 'Medium';
    
    return {
      capacityDrop: finalDrop,
      riskLevel,
      bottleneckFactor: (finalDrop / 15.0).toFixed(1),
    };
  }, [whatIfViolation, whatIfVehicle]);

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className={`flex flex-col items-center gap-3 rounded-3xl px-6 py-8 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
          <Loader2 className="animate-spin text-cyan-400" size={28} />
          <span className={`text-[11px] font-mono tracking-[0.24em] uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Running congestion models...
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
              <Layers size={13} />
              Congestion Impact Engine
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Urban Mobility Impact</h1>
            <p className={`mt-2 max-w-2xl text-sm leading-7 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Quantify the friction. Compute capacity loss, evaluate junction risk severities, and simulate obstruction impact values based on vehicle width and volume.
            </p>
          </div>
        </div>
      </Reveal>

      {/* Grid of Telemetry */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        
        {/* Left Side: Vehicle distribution and station rankings */}
        <div className="xl:col-span-8 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            
            {/* Pie Chart: Vehicle breakdown */}
            <Reveal>
              <div className={`rounded-3xl border p-5 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
                <h3 className="text-sm font-bold mb-2">Blockage by Vehicle Class</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Large vehicles block significantly more road width and lanes.
                </p>
                <div className="mt-4 h-56 flex items-center justify-center">
                  <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={vehicleDistribution}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                        >
                          {vehicleDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 space-y-1.5 pl-4 overflow-y-auto max-h-48 text-[11px] font-semibold">
                    {vehicleDistribution.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-slate-400 truncate">{entry.name}</span>
                        <span className="ml-auto font-mono text-slate-200">{(entry.value / 1000).toFixed(0)}k</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Bar Chart: Stations Congestion */}
            <Reveal delay={0.02}>
              <div className={`rounded-3xl border p-5 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
                <h3 className="text-sm font-bold mb-2">Highest Impact Sectors</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Average Congestion Score (0 - 100) calculated by police station bounds.
                </p>
                <div className="mt-4 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stationRankData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke={isDark ? '#1f2937' : '#e2e8f0'} strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={9} />
                      <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={9} domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="avgScore" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Reveal>

          </div>

          {/* Critical Junction Risk List */}
          <Reveal>
            <div className={`rounded-3xl border p-5 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="text-rose-400 animate-pulse" size={16} />
                Critical Junction bottlenecks
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.hotspots
                  .filter((h) => h.junction_name !== 'No Junction' && (h.junction_risk === 'Critical' || h.junction_risk === 'High'))
                  .slice(0, 6)
                  .map((h, index) => (
                    <div
                      key={h.cluster_id}
                      className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                        isDark ? 'border-white/5 bg-slate-900/40 hover:bg-slate-900/70' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-300 shrink-0">
                        <MapPin size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold leading-5 truncate">{h.junction_name}</h4>
                        <p className={`text-[10px] truncate ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{h.location}</p>
                        
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          <span className="rounded bg-rose-500/15 text-rose-300 px-1.5 py-0.5 text-[9px] font-bold">
                            Capacity: -{h.road_capacity_reduction}%
                          </span>
                          <span className="rounded bg-slate-800 text-slate-300 px-1.5 py-0.5 text-[9px] font-bold">
                            Risk: {h.junction_risk}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Right Side: What-If Capacity Simulator */}
        <div className="xl:col-span-4">
          <Reveal delay={0.04}>
            <div className={`rounded-3xl border p-5 space-y-5 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
              <div className="flex items-center gap-1.5 text-sm font-bold">
                <Sparkles size={15} className="text-cyan-300" />
                What-if obstruction model
              </div>
              <p className={`text-xs leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Simulate how specific types of illegal parking configurations impact local street throughput.
              </p>

              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Violation Type</label>
                  <select
                    value={whatIfViolation}
                    onChange={(e) => setWhatIfViolation(e.target.value)}
                    className={`w-full rounded-2xl border px-3 py-2.5 text-xs ${
                      isDark ? 'border-white/10 bg-slate-900/60 text-slate-200' : 'border-slate-200 bg-white text-slate-950'
                    }`}
                  >
                    <option value="NO PARKING">No Parking (Single lane blocked)</option>
                    <option value="WRONG PARKING">Wrong Parking (Angled placement)</option>
                    <option value="PARKING IN A MAIN ROAD">Main Road Parking (High speed corridor)</option>
                    <option value="DOUBLE PARKING">Double Parking (Blocks two full lanes)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Obstructing Vehicle Class</label>
                  <select
                    value={whatIfVehicle}
                    onChange={(e) => setWhatIfVehicle(e.target.value)}
                    className={`w-full rounded-2xl border px-3 py-2.5 text-xs ${
                      isDark ? 'border-white/10 bg-slate-900/60 text-slate-200' : 'border-slate-200 bg-white text-slate-950'
                    }`}
                  >
                    <option value="SCOOTER">Scooter / Motorcycle (Small width)</option>
                    <option value="PASSENGER AUTO">Passenger Auto (Medium width)</option>
                    <option value="CAR">Passenger Car / Sedan (Standard lane width)</option>
                    <option value="PRIVATE BUS">Private Bus / heavy LGV (Large width)</option>
                  </select>
                </div>
              </div>

              {/* Simulation Result Output */}
              <div className={`mt-4 rounded-3xl p-5 space-y-4 border ${
                whatIfResult.riskLevel === 'Critical' ? 'bg-rose-500/5 border-rose-500/15' :
                whatIfResult.riskLevel === 'High' ? 'bg-rose-500/5 border-rose-500/10' :
                whatIfResult.riskLevel === 'Medium' ? 'bg-amber-500/5 border-amber-500/10' : 'bg-emerald-500/5 border-emerald-500/10'
              }`}>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide">Simulated Capacity Drop</div>
                  <div className={`text-3xl font-black mt-1 ${
                    whatIfResult.capacityDrop >= 60 ? 'text-rose-400' :
                    whatIfResult.capacityDrop >= 30 ? 'text-amber-300' : 'text-emerald-400'
                  }`}>
                    {whatIfResult.capacityDrop}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Junction Risk Index:</span>
                    <span className={`font-bold uppercase tracking-wider ${
                      whatIfResult.riskLevel === 'Critical' ? 'text-rose-400' :
                      whatIfResult.riskLevel === 'High' ? 'text-rose-300' :
                      whatIfResult.riskLevel === 'Medium' ? 'text-amber-300' : 'text-emerald-400'
                    }`}>
                      {whatIfResult.riskLevel}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Bottleneck Multiplier:</span>
                    <span className="font-bold font-mono text-cyan-300">{whatIfResult.bottleneckFactor}x</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[10px] text-slate-400 border-t border-white/5 pt-3 leading-5">
                  <Info size={14} className="mt-0.5 shrink-0 text-cyan-300" />
                  <span>
                    A capacity drop of **{whatIfResult.capacityDrop}%** results in local traffic queuing up to **{whatIfResult.bottleneckFactor} times** faster during rush hour intervals.
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

      </div>
    </div>
  );
}
