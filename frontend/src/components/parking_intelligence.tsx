'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car,
  AlertCircle,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  Info,
  Calendar,
  X,
  Map,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
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
  recent_violations_30d: number;
  growth_rate: number;
  hotspot_score: number;
  category: 'Wrong Parking Hotspot' | 'Illegal Parking Hotspot' | 'Emerging Hotspot';
  predominant_violation: string;
  violation_distribution: Record<string, number>;
  vehicle_distribution: Record<string, number>;
  road_capacity_reduction: number;
  junction_risk: string;
  congestion_score: number;
  congestion_level: string;
  enforcement_priority: string;
  suggested_officers: number;
  expected_improvement_pct: number;
  tomorrow_predicted_count: number;
  tomorrow_probability: number;
  next_week_predicted_count: number;
  next_week_probability: number;
}

export default function ParkingIntelligence() {
  const { token, theme } = useStore();
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'forecast'>('map');

  const isDark = theme === 'dark';

  useEffect(() => {
    async function fetchHotspots() {
      setLoading(true);
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/parking/hotspots', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setHotspots(data);
            if (data.length > 0) {
              setSelectedHotspot(data[0]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load hotspots:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchHotspots();
  }, [token]);



  // Statistics
  const stats = useMemo(() => {
    if (!hotspots.length) return { totalViolations: 0, totalHotspots: 0, criticalCount: 0, avgReduction: 0 };
    const totalViolations = hotspots.reduce((acc, h) => acc + h.total_violations, 0);
    const criticalCount = hotspots.filter((h) => h.congestion_level === 'Critical' || h.congestion_level === 'High').length;
    const avgReduction = hotspots.reduce((acc, h) => acc + h.road_capacity_reduction, 0) / hotspots.length;
    return {
      totalViolations,
      totalHotspots: hotspots.length,
      criticalCount,
      avgReduction: Math.round(avgReduction),
    };
  }, [hotspots]);

  // Filtering
  const filteredHotspots = useMemo(() => {
    return hotspots.filter((h) => {
      const matchesSearch =
        h.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.police_station.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.geohash.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || h.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [hotspots, searchTerm, categoryFilter]);

  useEffect(() => {
    if (activeTab !== 'map' || filteredHotspots.length === 0) return;

    let mapInstance: any = null;

    const loadLeaflet = async () => {
      // Inject CSS if not present
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }

      // Inject script if not present
      if (!(window as any).L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.crossOrigin = '';
        await new Promise((resolve) => {
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      const L = (window as any).L;
      if (!L) return;

      const mapContainer = document.getElementById('leaflet-parking-map');
      if (!mapContainer) return;

      // Clean up previous map if it exists
      if ((mapContainer as any)._leaflet_id) {
        return; // Let the cleanup function or React state handle it
      }

      // Compute centroid
      const validHotspots = filteredHotspots.filter(h => h.latitude && h.longitude);
      if (validHotspots.length === 0) return;
      const centerLat = validHotspots.reduce((sum, h) => sum + h.latitude, 0) / validHotspots.length;
      const centerLon = validHotspots.reduce((sum, h) => sum + h.longitude, 0) / validHotspots.length;

      mapInstance = L.map('leaflet-parking-map', {
        zoomControl: false // position it manually or keep it clean
      }).setView([centerLat, centerLon], 13);

      L.control.zoom({
        position: 'bottomright'
      }).addTo(mapInstance);

      // Dark vs Light Mode tile layers
      const tileUrl = isDark 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      
      const attribution = isDark
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

      L.tileLayer(tileUrl, { attribution, maxZoom: 20 }).addTo(mapInstance);

      // Add markers
      validHotspots.forEach((h) => {
        let colorClass = 'bg-cyan-400 ring-cyan-400/30';
        if (h.category === 'Wrong Parking Hotspot') {
          colorClass = 'bg-amber-400 ring-amber-400/30';
        } else if (h.category === 'Emerging Hotspot') {
          colorClass = 'bg-purple-400 ring-purple-400/30';
        } else if (h.congestion_level === 'Critical') {
          colorClass = 'bg-rose-500 ring-rose-500/40';
        }

        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker-wrapper',
          html: `<div class="w-3.5 h-3.5 rounded-full ${colorClass} ring-4 animate-pulse border border-white shadow-md"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        const marker = L.marker([h.latitude, h.longitude], { icon: customIcon }).addTo(mapInstance);

        marker.bindPopup(`
          <div class="text-slate-900 font-sans p-1 text-[11px] leading-relaxed">
            <div class="font-bold text-xs border-b pb-1 mb-1 text-slate-800">${h.location}</div>
            <div>Junction Risk: <span class="font-bold text-rose-600">${h.junction_risk}</span></div>
            <div>Hotspot Score: <span class="font-bold">${h.hotspot_score}</span></div>
            <div>Congestion: <span class="font-bold">${h.congestion_level}</span></div>
          </div>
        `, { closeButton: false });

        marker.on('click', () => {
          setSelectedHotspot(h);
        });
      });
    };

    loadLeaflet();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [activeTab, filteredHotspots, isDark]);

  // Map limits for custom SVG rendering of Bengaluru
  const mapBounds = useMemo(() => {
    if (!hotspots.length) return { minLat: 12.8, maxLat: 13.3, minLon: 77.4, maxLon: 77.8 };
    const lats = hotspots.map((h) => h.latitude);
    const lons = hotspots.map((h) => h.longitude);
    return {
      minLat: Math.min(...lats) - 0.01,
      maxLat: Math.max(...lats) + 0.01,
      minLon: Math.min(...lons) - 0.01,
      maxLon: Math.max(...lons) + 0.01,
    };
  }, [hotspots]);

  // Convert lat/lon to SVG percentages
  const getSvgCoordinates = (lat: number, lon: number) => {
    const latRange = mapBounds.maxLat - mapBounds.minLat;
    const lonRange = mapBounds.maxLon - mapBounds.minLon;
    // Note: Lat goes from bottom to top, so invert Y
    const x = ((lon - mapBounds.minLon) / lonRange) * 100;
    const y = (1 - (lat - mapBounds.minLat) / latRange) * 100;
    return { x: `${x}%`, y: `${y}%` };
  };

  const selectedChartData = useMemo(() => {
    if (!selectedHotspot) return [];
    return Object.entries(selectedHotspot.violation_distribution).map(([name, value]) => ({
      name: name.replace(' PARKING', '').replace('NO ', ''),
      count: value,
    }));
  }, [selectedHotspot]);

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className={`flex flex-col items-center gap-3 rounded-3xl px-6 py-8 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
          <Loader2 className="animate-spin text-cyan-400" size={28} />
          <span className={`text-[11px] font-mono tracking-[0.24em] uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Processing hotspot clusters...
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
              Flipkart GRID Round 2 Upgrade
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Parking Hotspots</h1>
            <p className={`mt-2 max-w-2xl text-sm leading-7 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Geospatial clustering of parking violations. Pinpoint hotspots, view temporal growth rates, and inspect predicted hotspot probabilities.
            </p>
          </div>
          
          <div className="flex rounded-xl border border-white/10 bg-slate-900/40 p-1">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'map' ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Map size={13} /> Map View
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'list' ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car size={13} /> Details Matrix
            </button>
            <button
              onClick={() => setActiveTab('forecast')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'forecast' ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp size={13} /> AI Forecasts
            </button>
          </div>
        </div>
      </Reveal>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Violations Processed', value: '298,450', detail: 'Real-time & police records', icon: Car },
          { label: 'Geospatial Hotspots', value: stats.totalHotspots.toString(), detail: 'DBSCAN clustered (eps=100m)', icon: MapPin },
          { label: 'Critical / High Congestion', value: stats.criticalCount.toString(), detail: 'Enforcement deployment recommended', icon: ShieldAlert },
          { label: 'Avg Road Capacity Reduction', value: `${stats.avgReduction}%`, detail: 'Attributable to illegal parking', icon: TrendingUp },
        ].map((card, index) => {
          const Icon = card.icon;
          return (
            <Reveal key={card.label} delay={index * 0.02}>
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

      {/* Active Tab Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Left Side: Interactive Area or List */}
        <div className={`lg:col-span-8 space-y-4`}>
          {activeTab === 'map' && (
            <Reveal>
              <div className={`relative h-[550px] rounded-3xl border overflow-hidden ${isDark ? 'glass-card-dark bg-slate-950/20' : 'glass-card-light bg-slate-100'}`}>
                
                {/* Leaflet Geospatial Map Container */}
                <div id="leaflet-parking-map" className="absolute inset-0 w-full h-full z-10" />

                {/* Filters */}
                <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute top-2.5 left-3 text-slate-500" size={16} />
                    <input
                      type="text"
                      placeholder="Search by street, geohash, police station..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full rounded-2xl border px-9 py-2 text-sm ${
                        isDark ? 'border-white/10 bg-slate-900/60 text-slate-205 focus:border-cyan-400/30' : 'border-slate-200 bg-white text-slate-950 focus:border-cyan-500'
                      }`}
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={`rounded-2xl border px-4 py-2 text-sm ${
                      isDark ? 'border-white/10 bg-slate-900/60 text-slate-205 focus:border-cyan-400/30' : 'border-slate-200 bg-white text-slate-950 focus:border-cyan-500'
                    }`}
                  >
                    <option value="All">All Hotspot Types</option>
                    <option value="Illegal Parking Hotspot">Illegal Parking</option>
                    <option value="Wrong Parking Hotspot">Wrong Parking</option>
                    <option value="Emerging Hotspot">Emerging Hotspots</option>
                  </select>
                </div>

                <div className="absolute bottom-4 left-4 z-20 flex gap-4 rounded-xl border border-white/10 bg-slate-950/70 p-3 text-[10px] font-semibold tracking-wider text-slate-300 backdrop-blur-md">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Illegal Parking
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Wrong Parking
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-400" /> Emerging
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {activeTab === 'list' && (
            <Reveal>
              <div className={`rounded-3xl border p-5 overflow-hidden ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h3 className="text-sm font-bold">Hotspot Details Matrix</h3>
                  
                  {/* Local Search */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Filter by street..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`rounded-xl border px-3 py-1.5 text-xs ${
                        isDark ? 'border-white/10 bg-slate-900/60 text-slate-200' : 'border-slate-200 bg-white text-slate-950'
                      }`}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className={isDark ? 'bg-slate-900/70 text-slate-400' : 'bg-slate-50 text-slate-500'}>
                      <tr>
                        <th className="px-4 py-3 font-semibold">Location</th>
                        <th className="px-4 py-3 font-semibold">Geohash</th>
                        <th className="px-4 py-3 font-semibold text-center">Score</th>
                        <th className="px-4 py-3 font-semibold">Type</th>
                        <th className="px-4 py-3 font-semibold text-right">Violations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHotspots.slice(0, 15).map((h) => (
                        <tr
                          key={h.cluster_id}
                          onClick={() => setSelectedHotspot(h)}
                          className={`border-t cursor-pointer hover:bg-slate-500/5 ${isDark ? 'border-white/5' : 'border-slate-200'} ${
                            selectedHotspot?.cluster_id === h.cluster_id ? (isDark ? 'bg-cyan-500/5' : 'bg-cyan-50') : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold">{h.location}</div>
                            <div className="text-[10px] text-slate-500">{h.police_station} station</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-cyan-300">{h.geohash}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex rounded px-1.5 py-0.5 font-bold ${
                              h.hotspot_score >= 75 ? 'bg-rose-500/10 text-rose-300' :
                              h.hotspot_score >= 45 ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'
                            }`}>
                              {h.hotspot_score}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                              h.category === 'Emerging Hotspot' ? 'bg-purple-500/10 text-purple-300' :
                              h.category === 'Wrong Parking Hotspot' ? 'bg-amber-500/10 text-amber-300' : 'bg-cyan-500/10 text-cyan-300'
                            }`}>
                              {h.category.replace(' Hotspot', '')}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-right font-semibold">{h.total_violations}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Reveal>
          )}

          {activeTab === 'forecast' && (
            <Reveal>
              <div className={`rounded-3xl border p-5 overflow-hidden ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
                <div className="mb-4">
                  <h3 className="text-sm font-bold">AI Hotspot Forecasting Matrix</h3>
                  <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Predictions generated using ExtraTrees regressor. Models likelihood of persistent or growing bottlenecks.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className={isDark ? 'bg-slate-900/70 text-slate-400' : 'bg-slate-50 text-slate-500'}>
                      <tr>
                        <th className="px-4 py-3 font-semibold">Location / Geohash</th>
                        <th className="px-4 py-3 font-semibold text-center">Tomorrow Est.</th>
                        <th className="px-4 py-3 font-semibold text-center">Tomorrow Prob.</th>
                        <th className="px-4 py-3 font-semibold text-center">Next Week Est.</th>
                        <th className="px-4 py-3 font-semibold text-center">Hotspot Prob.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHotspots.slice(0, 15).map((h) => (
                        <tr
                          key={h.cluster_id}
                          onClick={() => setSelectedHotspot(h)}
                          className={`border-t cursor-pointer hover:bg-slate-500/5 ${isDark ? 'border-white/5' : 'border-slate-200'} ${
                            selectedHotspot?.cluster_id === h.cluster_id ? (isDark ? 'bg-cyan-500/5' : 'bg-cyan-50') : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold">{h.location}</div>
                            <div className="font-mono text-[10px] text-cyan-300">{h.geohash}</div>
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-medium">{h.tomorrow_predicted_count}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-12 bg-slate-800 rounded-full h-1.5">
                                <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: `${h.tomorrow_probability * 100}%` }} />
                              </div>
                              <span className="font-mono w-8">{(h.tomorrow_probability * 100).toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-medium">{h.next_week_predicted_count}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex rounded px-1.5 py-0.5 font-bold ${
                              h.next_week_probability >= 0.8 ? 'bg-rose-500/10 text-rose-300' :
                              h.next_week_probability >= 0.5 ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'
                            }`}>
                              {(h.next_week_probability * 100).toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Reveal>
          )}
        </div>

        {/* Right Side: Selected Hotspot Details */}
        <div className="lg:col-span-4">
          <Reveal delay={0.06}>
            <AnimatePresence mode="wait">
              {selectedHotspot ? (
                <motion.div
                  key={selectedHotspot.cluster_id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`rounded-3xl border p-5 space-y-5 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                        selectedHotspot.category === 'Emerging Hotspot' ? 'bg-purple-500/10 text-purple-300' :
                        selectedHotspot.category === 'Wrong Parking Hotspot' ? 'bg-amber-500/10 text-amber-300' : 'bg-cyan-500/10 text-cyan-300'
                      }`}>
                        {selectedHotspot.category}
                      </span>
                      <h3 className="mt-2 text-base font-bold leading-tight">{selectedHotspot.location}</h3>
                      <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                        <MapPin size={12} /> {selectedHotspot.latitude.toFixed(5)}, {selectedHotspot.longitude.toFixed(5)} ({selectedHotspot.geohash})
                      </p>
                    </div>
                  </div>

                  <div className={`border-t pt-4 grid grid-cols-2 gap-3 ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide">Hotspot Score</div>
                      <div className="text-xl font-black text-cyan-300 mt-1">{selectedHotspot.hotspot_score}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide">Total Violations</div>
                      <div className="text-xl font-black mt-1">{selectedHotspot.total_violations}</div>
                    </div>
                  </div>

                  <div className={`border-t pt-4 space-y-3 ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Congestion Impact Parameters</h4>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Congestion Score:</span>
                      <span className={`font-bold ${
                        selectedHotspot.congestion_level === 'Critical' ? 'text-rose-400' :
                        selectedHotspot.congestion_level === 'High' ? 'text-rose-300' :
                        selectedHotspot.congestion_level === 'Medium' ? 'text-amber-300' : 'text-emerald-300'
                      }`}>
                        {selectedHotspot.congestion_score}/100 ({selectedHotspot.congestion_level})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Road Capacity Reduction:</span>
                      <span className="font-semibold text-rose-300">{selectedHotspot.road_capacity_reduction}%</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Junction Risk:</span>
                      <span className={`font-bold ${
                        selectedHotspot.junction_risk === 'Critical' || selectedHotspot.junction_risk === 'High' ? 'text-rose-300' : 'text-slate-300'
                      }`}>
                        {selectedHotspot.junction_risk}
                      </span>
                    </div>
                  </div>

                  {/* Violation breakdown chart */}
                  <div className={`border-t pt-4 ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Violations Distribution</h4>
                    <div className="h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={selectedChartData} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                          <XAxis type="number" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={9} />
                          <YAxis dataKey="name" type="category" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={9} width={60} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Forecast snippet */}
                  <div className={`border-t pt-4 rounded-2xl bg-cyan-500/5 p-3 border border-cyan-500/10 space-y-2`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                      <Calendar size={13} /> Forecast Forecast Matrix
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Likelihood of congestion tomorrow is **{(selectedHotspot.tomorrow_probability * 100).toFixed(0)}%** with an estimated **{selectedHotspot.tomorrow_predicted_count}** parking offenses.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className={`rounded-3xl border p-5 text-center text-xs text-slate-500 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
                  Select a hotspot to view deep analytics.
                </div>
              )}
            </AnimatePresence>
          </Reveal>
        </div>

      </div>
    </div>
  );
}
