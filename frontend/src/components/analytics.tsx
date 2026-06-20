'use client';

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { BarChart4, Filter, Download, Sparkles, MapPin } from 'lucide-react';

export default function Analytics() {
  const { theme } = useStore();
  const [selectedRoad, setSelectedRoad] = useState('All');
  const [selectedWeather, setSelectedWeather] = useState('All');

  const hourlyProfiles = [
    { hour: '00:00', load: 0.15 },
    { hour: '03:00', load: 0.08 },
    { hour: '06:00', load: 0.45 },
    { hour: '09:00', load: 0.85 },
    { hour: '12:00', load: 0.62 },
    { hour: '15:00', load: 0.74 },
    { hour: '18:00', load: 0.91 },
    { hour: '21:00', load: 0.38 },
  ];

  const weeklyProfiles = [
    { day: 'Mon', load: 0.72 },
    { day: 'Tue', load: 0.74 },
    { day: 'Wed', load: 0.79 },
    { day: 'Thu', load: 0.82 },
    { day: 'Fri', load: 0.88 },
    { day: 'Sat', load: 0.34 },
    { day: 'Sun', load: 0.28 },
  ];

  const isDark = theme === 'dark';

  const handleExportCSV = () => {
    const csvRows = [];
    csvRows.push("Type,Time/Day,Value/Load");
    
    hourlyProfiles.forEach(p => {
      csvRows.push(`Hourly Profile,${p.hour},${p.load}`);
    });
    weeklyProfiles.forEach(p => {
      csvRows.push(`Weekly Profile,${p.day},${p.load}`);
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `traffic_analytics_report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl font-extrabold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>Enterprise Analytics</h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-550'} mt-1`}>Drill down into demand fluctuations, apply filters, and compile summaries.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Download size={12} />
            Export Config
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={`p-4 rounded-xl border flex flex-wrap gap-4 items-center ${
        isDark ? 'bg-[#0d131f] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <span className="text-xs font-bold text-sky-500 uppercase tracking-wider flex items-center gap-1.5">
          <Filter size={14} />
          Active Filters
        </span>

        <div>
          <select
            value={selectedRoad}
            onChange={(e) => setSelectedRoad(e.target.value)}
            className={`border rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-sky-500 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <option value="All">All Road Types</option>
            <option value="Highway">Highways Only</option>
            <option value="Street">Street Grids Only</option>
          </select>
        </div>

        <div>
          <select
            value={selectedWeather}
            onChange={(e) => setSelectedWeather(e.target.value)}
            className={`border rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-sky-500 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <option value="All">All Weather Conditions</option>
            <option value="Sunny">Sunny</option>
            <option value="Rainy">Rainy</option>
          </select>
        </div>

        <span className={`text-[10px] ml-auto font-mono font-semibold ${isDark ? 'text-slate-500' : 'text-slate-450'}`}>
          Filtered subsets: 48,620 / 48,620 records
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Hourly Profile Chart */}
        <div className={`p-5 flex flex-col justify-between ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
          <div>
            <h3 className={`text-sm font-bold font-display ${isDark ? 'text-slate-200' : 'text-slate-800'} mb-1 flex items-center gap-2`}>
              <BarChart4 size={16} className="text-sky-500" />
              Aggregated Hourly Profiles
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-550'} mb-4`}>Mean predictive demand loads recorded over 24-hour schedules.</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyProfiles} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeDasharray="3 3" />
                <XAxis dataKey="hour" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={9} />
                <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#0d131f' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0' }} />
                <Bar dataKey="load" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Profile Chart */}
        <div className={`p-5 flex flex-col justify-between ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
          <div>
            <h3 className={`text-sm font-bold font-display ${isDark ? 'text-slate-200' : 'text-slate-800'} mb-1 flex items-center gap-2`}>
              <BarChart4 size={16} className="text-sky-500" />
              Day-of-Week Load Indices
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-550'} mb-4`}>Variations in target traffic demand weights during weekdays and weekends.</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyProfiles} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={9} />
                <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#0d131f' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0' }} />
                <Line type="monotone" dataKey="load" stroke="#8b5cf6" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
