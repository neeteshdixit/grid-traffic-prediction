'use client';

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { GitFork, ArrowRight, PlayCircle, Settings2, ShieldCheck, Sparkles } from 'lucide-react';

export default function FeatureEngineering() {
  const { theme } = useStore();
  const [selectedNode, setSelectedNode] = useState('cyclical');

  const nodes = [
    { id: 'ingest', label: 'Raw Ingestion', desc: 'Reads CSV files containing timestamp, geohash, and demand columns.' },
    { id: 'datetime', label: 'Temporal Splits', desc: 'Parses timestamps to extract integer hour, day_of_week, and day.' },
    { id: 'cyclical', label: 'Cyclical Time', desc: 'Encodes hour using trigonometric sin/cos coordinate transformations.' },
    { id: 'geohash', label: 'Geohash Coordinates', desc: 'Decodes geohash strings to retrieve lat/lon coordinates.' },
    { id: 'impute', label: 'Mode Imputation', desc: 'Imputes missing records in numeric attributes using target averages.' },
  ];

  const nodeDetails: Record<string, any> = {
    ingest: {
      title: 'Raw Ingestion Parameters',
      formula: 'pd.read_csv("dataset.csv", dtype={"geohash": str})',
      inputs: ['timestamp', 'geohash', 'demand'],
      outputs: ['raw_df']
    },
    datetime: {
      title: 'Temporal Extraction Formulas',
      formula: 'df["hour"] = df["timestamp"].dt.hour\ndf["day"] = df["timestamp"].dt.day',
      inputs: ['timestamp'],
      outputs: ['hour', 'day', 'day_of_week']
    },
    cyclical: {
      title: 'Trigonometric Transformations',
      formula: 'df["sin_time"] = np.sin(2 * np.pi * df["hour"] / 24.0)\ndf["cos_time"] = np.cos(2 * np.pi * df["hour"] / 24.0)',
      inputs: ['hour'],
      outputs: ['sin_time', 'cos_time']
    },
    geohash: {
      title: 'Geohash Coordinate Decoders',
      formula: 'df["lat"], df["lon"] = geohash.decode(df["geohash"])',
      inputs: ['geohash'],
      outputs: ['lat', 'lon']
    },
    impute: {
      title: 'Target Average & Mean Imputers',
      formula: 'df[col] = df[col].fillna(df[col].mean())',
      inputs: ['raw_df'],
      outputs: ['imputed_df']
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl font-extrabold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>Feature Engineering</h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-550'} mt-1`}>Visualize pipeline workflows, feature split equations, and transform raw sensors to train arrays.</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold ${
          isDark ? 'bg-sky-950/40 border-sky-500/20 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-700'
        }`}>
          <Sparkles size={13} className="animate-spin" />
          Pipeline Verified
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Flow Diagram Workspace */}
        <div className={`p-5 lg:col-span-2 flex flex-col justify-between ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
          <div>
            <h3 className={`text-sm font-bold font-display ${isDark ? 'text-slate-200' : 'text-slate-800'} mb-2 flex items-center gap-2`}>
              <GitFork size={16} className="text-sky-500" />
              Transformation Pipeline Flow
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-550'} mb-6`}>Click on nodes below to review code execution segments and outputs schema.</p>
          </div>

          {/* Interactive Flow Layout */}
          <div className="flex flex-col gap-4 py-6 relative">
            {nodes.map((node, idx) => {
              const isSelected = selectedNode === node.id;
              return (
                <div key={node.id} className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedNode(node.id)}
                    className={`w-full max-w-md p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'ring-2 ring-sky-500 border-transparent scale-102 bg-sky-500/10'
                        : isDark
                          ? 'bg-slate-900 border-slate-850 hover:bg-slate-800'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold font-display ${isSelected ? 'text-sky-400' : isDark ? 'text-white' : 'text-slate-850'}`}>
                        {idx + 1}. {node.label}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        isSelected 
                          ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' 
                          : isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-650 border-slate-250'
                      }`}>
                        ACTIVE NODE
                      </span>
                    </div>
                    <p className={`text-[10px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>{node.desc}</p>
                  </button>
                  {idx < nodes.length - 1 && (
                    <div className={`w-0.5 h-6 border-l-2 border-dashed ${isDark ? 'border-slate-800' : 'border-slate-300'} my-1`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Node Inspector Details */}
        <div className={`p-5 flex flex-col justify-between ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
          <div>
            <h3 className={`text-sm font-bold font-display ${isDark ? 'text-slate-200' : 'text-slate-800'} mb-1 flex items-center gap-2`}>
              <Settings2 size={16} className="text-sky-500" />
              Node Inspector
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-550'} mb-4`}>Technical blueprints of transformation node.</p>
          </div>

          <div className="space-y-4 my-2 flex-1">
            <div className={`p-3 rounded-lg border font-mono text-[10px] ${isDark ? 'bg-slate-900 border-slate-850 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
              <div className={`text-[9px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Python Formula / Expression</div>
              <pre className="whitespace-pre-wrap">{nodeDetails[selectedNode]?.formula}</pre>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-850' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`text-[9px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-550' : 'text-slate-450'}`}>Inputs Required</div>
                <div className="flex flex-wrap gap-1.5">
                  {nodeDetails[selectedNode]?.inputs.map((inp: string) => (
                    <span key={inp} className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-850 text-slate-400' : 'bg-slate-200 text-slate-700'}`}>
                      {inp}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-850' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`text-[9px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-550' : 'text-slate-450'}`}>Outputs Created</div>
                <div className="flex flex-wrap gap-1.5">
                  {nodeDetails[selectedNode]?.outputs.map((out: string) => (
                    <span key={out} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 font-semibold border border-sky-500/25">
                      {out}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={`text-[10px] p-3 rounded-lg border mt-4 ${
            isDark ? 'bg-[#0f1524] border-slate-800 text-slate-450' : 'bg-slate-50 border-slate-200 text-slate-600'
          } flex gap-2 items-center`}>
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Target outputs will be fully cached to prevent re-execution during AutoML runs.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
