'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Upload, Database, Eye, CheckCircle, AlertCircle, Loader2, Sparkles, HelpCircle } from 'lucide-react';

export default function Datasets() {
  const { token, theme, datasets, setDatasets } = useStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<'train' | 'test'>('train');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    fetchDatasets();
  }, [token]);

  const fetchDatasets = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/datasets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setDatasets(data);
      }
    } catch (err) {
      console.error("Error fetching datasets:", err);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) {
      setMessage({ type: 'error', text: 'Please input dataset name and select a CSV file.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('type', type);
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/v1/datasets/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Dataset successfully registered! Rows: ${data.row_count}` });
        setName('');
        setFile(null);
        // Clear input element
        const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        fetchDatasets();
        // Load profile view
        setSelectedProfile({
          name: data.name,
          row_count: data.row_count,
          schema_info: data.schema_info
        });
      } else {
        setMessage({ type: 'error', text: data.detail || 'Upload process failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network connection timeout.' });
    } finally {
      setUploading(false);
    }
  };

  const loadProfile = async (id: string) => {
    setLoadingProfile(true);
    setSelectedProfile(null);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/datasets/${id}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedProfile(data);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-extrabold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>Dataset Analysis</h1>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-550'} mt-1`}>Upload sensor measurements, investigate features correlation, and preview data distribution matrices.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Card */}
        <div className={`p-5 h-fit ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
          <h3 className={`text-sm font-bold font-display ${isDark ? 'text-slate-200' : 'text-slate-800'} mb-4 flex items-center gap-2`}>
            <Upload size={16} className="text-sky-500" />
            Upload Sensor Logs (CSV)
          </h3>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-450' : 'text-slate-550'}`}>Dataset Name</label>
              <input
                type="text"
                placeholder="e.g. Traffic Sensors June"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-xs transition-all focus:outline-none ${
                  isDark 
                    ? 'bg-[#0a0f1d] border-slate-850 text-slate-205 focus:border-sky-500' 
                    : 'bg-white border-slate-250 text-slate-800 focus:border-sky-600'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-450' : 'text-slate-550'}`}>Dataset Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className={`w-full border rounded-lg px-3 py-2 text-xs transition-all focus:outline-none ${
                  isDark 
                    ? 'bg-[#0a0f1d] border-slate-850 text-slate-205 focus:border-sky-500' 
                    : 'bg-white border-slate-250 text-slate-800 focus:border-sky-600'
                }`}
              >
                <option value="train">Training (With target labels)</option>
                <option value="test">Test Scoring (Inference only)</option>
              </select>
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-450' : 'text-slate-550'}`}>Select File</label>
              <input
                id="file-upload-input"
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className={`w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold ${
                  isDark
                    ? 'text-slate-400 file:bg-sky-950/40 file:text-sky-400 hover:file:bg-sky-950/60'
                    : 'text-slate-500 file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100'
                } file:cursor-pointer`}
                required
              />
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-xs flex gap-2 items-start border ${
                message.type === 'success' 
                  ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-950/20 border-red-500/20 text-red-400'
              }`}>
                {message.type === 'success' ? <CheckCircle size={14} className="mt-0.5" /> : <AlertCircle size={14} className="mt-0.5" />}
                <span>{message.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                isDark
                  ? 'bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500'
                  : 'bg-sky-600 text-white hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating Profiles...
                </>
              ) : (
                'Upload Ingest'
              )}
            </button>
          </form>
        </div>

        {/* Datasets Ledger Table */}
        <div className={`p-5 lg:col-span-2 flex flex-col justify-between ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
          <div>
            <h3 className={`text-sm font-bold font-display ${isDark ? 'text-slate-200' : 'text-slate-800'} mb-4 flex items-center gap-2`}>
              <Database size={16} className="text-sky-500" />
              Available Datasets Ledger
            </h3>

            <div className={`overflow-x-auto border rounded-lg ${isDark ? 'border-slate-850' : 'border-slate-250'}`}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[10px] uppercase font-semibold ${
                    isDark ? 'bg-slate-900 border-slate-850 text-slate-450' : 'bg-slate-50 border-slate-200 text-slate-550'
                  }`}>
                    <th className="p-3">Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Rows</th>
                    <th className="p-3">Upload Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {datasets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 italic">No datasets uploaded yet. Please use the form on the left.</td>
                    </tr>
                  ) : (
                    datasets.map((ds) => (
                      <tr key={ds.id} className={`hover:bg-slate-800/10 ${isDark ? 'text-slate-300 border-slate-850' : 'text-slate-700 border-slate-200'}`}>
                        <td className="p-3 font-semibold">{ds.name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            ds.type === 'train' 
                              ? 'bg-sky-950/40 text-sky-400 border-sky-850' 
                              : 'bg-amber-950/40 text-amber-400 border-amber-850'
                          }`}>
                            {ds.type === 'train' ? 'TRAIN' : 'TEST'}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{ds.row_count.toLocaleString()}</td>
                        <td className="p-3">{new Date(ds.created_at).toLocaleDateString()}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => loadProfile(ds.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold border transition-all ${
                              isDark
                                ? 'bg-sky-950/40 text-sky-400 border-sky-850 hover:bg-sky-900/60'
                                : 'bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100'
                            }`}
                          >
                            <Eye size={12} />
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Profile telemetry */}
      {loadingProfile && (
        <div className="flex justify-center items-center py-10 gap-2 font-mono text-xs">
          <Loader2 className="animate-spin text-sky-500" size={16} />
          Compiling profile correlations...
        </div>
      )}

      {selectedProfile && (
        <div className={`p-6 space-y-6 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
          <div className="flex justify-between items-center border-b pb-4 border-slate-850">
            <div>
              <h3 className={`text-lg font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>Profiling Report: {selectedProfile.name}</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>Total Rows: <strong>{selectedProfile.row_count.toLocaleString()}</strong></p>
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-mono bg-sky-950/40 text-sky-400 border border-sky-850">
              <Sparkles size={11} /> Profiler Active
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Columns Schema */}
            <div className="space-y-3">
              <h4 className={`text-xs font-bold uppercase tracking-wider pb-2 border-b ${isDark ? 'text-sky-400 border-slate-800' : 'text-sky-700 border-slate-200'}`}>
                Column Features Catalog
              </h4>
              <div className="overflow-x-auto border rounded-lg border-slate-850">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-[9px] uppercase font-semibold ${
                      isDark ? 'bg-slate-900 border-slate-850 text-slate-450' : 'bg-slate-50 border-slate-200 text-slate-550'
                    }`}>
                      <th className="p-2.5">Feature Name</th>
                      <th className="p-2.5">Dtype</th>
                      <th className="p-2.5">Unique Count</th>
                      <th className="p-2.5">Missing Rows</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs font-mono">
                    {selectedProfile.schema_info.columns.map((col: string) => (
                      <tr key={col} className={`hover:bg-slate-800/10 ${isDark ? 'text-slate-350 border-slate-850' : 'text-slate-650 border-slate-200'}`}>
                        <td className="p-2.5 font-semibold text-slate-200">{col}</td>
                        <td className="p-2.5 text-sky-400">{selectedProfile.schema_info.dtypes[col] || 'float64'}</td>
                        <td className="p-2.5">{selectedProfile.schema_info.uniques[col] ?? 0}</td>
                        <td className="p-2.5 text-rose-450 font-bold">{selectedProfile.schema_info.missing[col] ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Target Distribution Metrics */}
            <div className="space-y-3">
              <h4 className={`text-xs font-bold uppercase tracking-wider pb-2 border-b ${isDark ? 'text-sky-400 border-slate-800' : 'text-sky-700 border-slate-200'}`}>
                Target Distribution Stats (demand)
              </h4>
              {selectedProfile.schema_info.target_stats ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(selectedProfile.schema_info.target_stats).map(([stat, val]: any) => (
                    <div key={stat} className={`p-4 rounded-xl border flex justify-between items-center ${
                      isDark ? 'bg-[#0a0f1d] border-slate-850' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-xs capitalize font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stat}</span>
                      <span className={`text-sm font-bold font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {typeof val === 'number' ? val.toFixed(4) : val}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`p-8 text-center border rounded-xl text-xs italic ${
                  isDark ? 'bg-[#0a0f1d] border-slate-850 text-slate-550' : 'bg-slate-50 border-slate-200 text-slate-450'
                }`}>
                  This dataset is compiled for test scoring; no target variable distribution metrics are available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
