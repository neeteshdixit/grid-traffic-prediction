'use client';

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Settings, Save, Sparkles, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const { theme, toggleTheme, user } = useStore();
  const [dbUrl, setDbUrl] = useState('mongodb://localhost:27017');
  const [dbName, setDbName] = useState('traffic_prediction');
  const [defaultSplit, setDefaultSplit] = useState(5);
  const [defaultLr, setDefaultLr] = useState(0.05);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Settings configuration parameters successfully updated!');
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl font-extrabold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>Settings</h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-550'} mt-1`}>Manage connection configurations, MongoDB parameters, security parameters, and profile defaults.</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold ${
          isDark ? 'bg-sky-950/40 border-sky-500/20 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-700'
        }`}>
          <ShieldCheck size={13} className="text-emerald-500" />
          Settings Synchronized
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form: Profile & DB settings */}
        <div className={`p-5 lg:col-span-2 space-y-6 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
          <div>
            <h3 className={`text-sm font-bold font-display ${isDark ? 'text-slate-200' : 'text-slate-800'} mb-4 flex items-center gap-2`}>
              <Settings size={16} className="text-sky-500" />
              General Parameters Configuration
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-455' : 'text-slate-550'}`}>Corporate User Profile</label>
              <input
                type="text"
                value={user?.full_name || 'Sarah Connor'}
                disabled
                className={`w-full border rounded-lg px-3 py-2 text-xs opacity-60 focus:outline-none ${
                  isDark ? 'bg-slate-900 border-slate-850 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              />
            </div>
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-455' : 'text-slate-550'}`}>Corporate Email</label>
              <input
                type="text"
                value={user?.email || 'scientist@traffic.ai'}
                disabled
                className={`w-full border rounded-lg px-3 py-2 text-xs opacity-60 focus:outline-none ${
                  isDark ? 'bg-slate-900 border-slate-850 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              />
            </div>
          </div>

          <div className="border-t border-slate-800/60 pt-4 space-y-4">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>MongoDB Ingestion Properties</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-455' : 'text-slate-550'}`}>MONGODB_URL</label>
                <input
                  type="text"
                  value={dbUrl}
                  onChange={(e) => setDbUrl(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-xs transition-all focus:outline-none focus:border-sky-500 ${
                    isDark 
                      ? 'bg-[#0a0f1d] border-slate-850 text-slate-205 focus:border-sky-500' 
                      : 'bg-white border-slate-250 text-slate-800 focus:border-sky-600'
                  }`}
                  required
                />
              </div>
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-455' : 'text-slate-550'}`}>MONGODB_DB_NAME</label>
                <input
                  type="text"
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-xs transition-all focus:outline-none focus:border-sky-500 ${
                    isDark 
                      ? 'bg-[#0a0f1d] border-slate-850 text-slate-205 focus:border-sky-500' 
                      : 'bg-white border-slate-250 text-slate-800 focus:border-sky-600'
                  }`}
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              isDark
                ? 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                : 'bg-sky-600 text-white hover:bg-sky-500'
            }`}
          >
            <Save size={14} />
            Save Configurations
          </button>
        </div>

        {/* Right Form: Defaults parameters */}
        <div className={`p-5 h-fit space-y-6 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
          <div>
            <h3 className={`text-sm font-bold font-display ${isDark ? 'text-slate-200' : 'text-slate-800'} mb-4 flex items-center gap-2`}>
              <Sparkles size={16} className="text-sky-500" />
              SaaS Environment defaults
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-455' : 'text-slate-550'}`}>AutoML Folds Split Size (K-Fold)</label>
              <input
                type="number"
                value={defaultSplit}
                onChange={(e) => setDefaultSplit(parseInt(e.target.value))}
                className={`w-full border rounded-lg px-3 py-2 text-xs font-mono transition-all focus:outline-none focus:border-sky-500 ${
                  isDark 
                    ? 'bg-[#0a0f1d] border-slate-850 text-slate-205 focus:border-sky-500' 
                    : 'bg-white border-slate-250 text-slate-800 focus:border-sky-600'
                }`}
              />
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-455' : 'text-slate-550'}`}>Default Learning Rate Default</label>
              <input
                type="number"
                step="0.01"
                value={defaultLr}
                onChange={(e) => setDefaultLr(parseFloat(e.target.value))}
                className={`w-full border rounded-lg px-3 py-2 text-xs font-mono transition-all focus:outline-none focus:border-sky-500 ${
                  isDark 
                    ? 'bg-[#0a0f1d] border-slate-850 text-slate-205 focus:border-sky-500' 
                    : 'bg-white border-slate-250 text-slate-800 focus:border-sky-600'
                }`}
              />
            </div>

            <div className="border-t border-slate-800/60 pt-4 flex justify-between items-center">
              <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>System Appearance Theme</span>
              <button
                type="button"
                onClick={toggleTheme}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-800'
                    : 'bg-slate-100 border-slate-250 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Toggle Theme
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
