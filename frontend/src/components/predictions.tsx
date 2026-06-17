'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Cpu, FileText, Download, Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function Predictions() {
  const { token, theme, datasets, predictions, setPredictions } = useStore();
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedDataset, setSelectedDataset] = useState('');
  const [scoring, setScoring] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; downloadId?: string } | null>(null);

  useEffect(() => {
    fetchMetadata();
  }, [token]);

  const fetchMetadata = async () => {
    try {
      // Models leaderboard
      const resModels = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/models/leaderboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataModels = await resModels.json();
      if (Array.isArray(dataModels)) {
        setModels(dataModels);
        if (dataModels.length > 0) setSelectedModel(dataModels[0].id);
      }

      // Predictions list
      const resPreds = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/predictions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataPreds = await resPreds.json();
      if (Array.isArray(dataPreds)) {
        setPredictions(dataPreds);
      }
    } catch (err) {
      console.error("Error loading predictions data:", err);
    }
  };

  const handleScoreDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel || !selectedDataset) {
      setMessage({ type: 'error', text: 'Please ensure both active model and scoring dataset are selected.' });
      return;
    }

    setScoring(true);
    setMessage(null);

    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/predictions/score', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model_id: selectedModel,
          dataset_id: selectedDataset
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Inference scoring task complete! Processed ${data.row_count} records.`,
          downloadId: data.id
        });
        fetchMetadata();
      } else {
        setMessage({ type: 'error', text: data.detail || 'Inference scoring failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network connection failure.' });
    } finally {
      setScoring(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-extrabold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>Prediction Center</h1>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-550'} mt-1`}>Run batch inference predictions on test datasets using trained champion estimators, and export submission files.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Batch Inferences Console */}
        <div className={`p-5 h-fit ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
          <h3 className={`text-sm font-bold font-display ${isDark ? 'text-slate-200' : 'text-slate-800'} mb-4 flex items-center gap-2`}>
            <Cpu size={16} className="text-sky-500" />
            Batch Scoring Console
          </h3>

          <form onSubmit={handleScoreDataset} className="space-y-4">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-450' : 'text-slate-550'}`}>Select Estimator Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-xs transition-all focus:outline-none ${
                  isDark 
                    ? 'bg-[#0a0f1d] border-slate-850 text-slate-205 focus:border-sky-500' 
                    : 'bg-white border-slate-250 text-slate-800 focus:border-sky-600'
                }`}
                required
              >
                {models.length === 0 ? (
                  <option value="">No models trained (runs default)</option>
                ) : (
                  models.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.algorithm})</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-450' : 'text-slate-550'}`}>Select Scoring Dataset</label>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-xs transition-all focus:outline-none ${
                  isDark 
                    ? 'bg-[#0a0f1d] border-slate-850 text-slate-205 focus:border-sky-500' 
                    : 'bg-white border-slate-250 text-slate-800 focus:border-sky-600'
                }`}
                required
              >
                <option value="">Select test dataset</option>
                {datasets.filter(d => d.type === 'test').map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.row_count.toLocaleString()} rows)</option>
                ))}
              </select>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-xs space-y-2 border ${
                message.type === 'success' 
                  ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-950/20 border-red-500/20 text-red-400'
              }`}>
                <div className="flex gap-2 items-start">
                  {message.type === 'success' ? <CheckCircle size={14} className="mt-0.5" /> : <AlertCircle size={14} className="mt-0.5" />}
                  <span>{message.text}</span>
                </div>
                {message.downloadId && (
                  <a
                    href={`http://localhost:8000/api/v1/predictions/download/${message.downloadId}`}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] transition-all"
                  >
                    <Download size={12} />
                    Download Scored CSV
                  </a>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={scoring || !selectedDataset}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                isDark
                  ? 'bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500'
                  : 'bg-sky-600 text-white hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400'
              }`}
            >
              {scoring ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating Inferences...
                </>
              ) : (
                <>
                  <Play size={13} fill="currentColor" />
                  Generate Predictions
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction History Ledger */}
        <div className={`p-5 lg:col-span-2 flex flex-col justify-between ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
          <div>
            <h3 className={`text-sm font-bold font-display ${isDark ? 'text-slate-200' : 'text-slate-800'} mb-4 flex items-center gap-2`}>
              <FileText size={16} className="text-sky-500" />
              Completed Inferences Output Ledger
            </h3>

            <div className={`overflow-x-auto border rounded-lg ${isDark ? 'border-slate-850' : 'border-slate-250'}`}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[10px] uppercase font-semibold ${
                    isDark ? 'bg-slate-900 border-slate-850 text-slate-450' : 'bg-slate-50 border-slate-200 text-slate-550'
                  }`}>
                    <th className="p-3">Prediction Task ID</th>
                    <th className="p-3">Scored Rows</th>
                    <th className="p-3">Computation Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {predictions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500 italic">No inference outputs found. Please use the form on the left.</td>
                    </tr>
                  ) : (
                    predictions.map((pred) => (
                      <tr key={pred.id} className={`hover:bg-slate-800/10 ${isDark ? 'text-slate-300 border-slate-850' : 'text-slate-750 border-slate-200'}`}>
                        <td className="p-3 font-mono text-sky-400 font-semibold">{pred.id}</td>
                        <td className="p-3 font-mono">{pred.row_count.toLocaleString()}</td>
                        <td className="p-3">{new Date(pred.created_at).toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <a
                            href={`http://localhost:8000/api/v1/predictions/download/${pred.id}`}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold border transition-all ${
                              isDark
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-850 hover:bg-emerald-900/60'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                            }`}
                          >
                            <Download size={12} />
                            Download CSV
                          </a>
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
    </div>
  );
}
