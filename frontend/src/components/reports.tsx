'use client';

import React from 'react';
import { useStore } from '../store/useStore';
import { FileText, Download, CheckCircle, Clock, Sparkles } from 'lucide-react';

export default function Reports() {
  const { token, theme } = useStore();
  const isDark = theme === 'dark';

  const handleDownloadReport = async (reportId: string) => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + `/api/v1/reports/pdf/${reportId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportId}_Report.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to download PDF report file.");
      }
    } catch (err) {
      console.error("Error downloading report:", err);
      alert("Error downloading report.");
    }
  };

  const mockReports = [
    {
      id: 'REP-001',
      title: 'AutoML Champion Validation Summary',
      type: 'Model Evaluation',
      date: 'June 2, 2026',
      size: '2.4 MB',
      status: 'Ready'
    },
    {
      id: 'REP-002',
      title: 'Geographical Sensor Profiles Audit',
      type: 'Data Profiling',
      date: 'June 1, 2026',
      size: '4.8 MB',
      status: 'Ready'
    },
    {
      id: 'REP-003',
      title: 'Q2 Inference Demand Predictions Output',
      type: 'Batch Prediction',
      date: 'May 28, 2026',
      size: '1.2 MB',
      status: 'Archived'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl font-extrabold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>Reports & Exports</h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-550'} mt-1`}>Inspect automatically compiled performance summaries, and download PDF sheets.</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold ${
          isDark ? 'bg-sky-950/40 border-sky-500/20 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-700'
        }`}>
          <Sparkles size={13} className="animate-spin" />
          Auto-Reports Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Reports Ledger List */}
        <div className="lg:col-span-2 space-y-4">
          {mockReports.map((report) => (
            <div
              key={report.id}
              className={`p-5 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all ${
                isDark ? 'glass-card-dark' : 'glass-card-light'
              }`}
            >
              <div className="flex gap-4 items-start">
                <div className={`p-3 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-sky-950/40 text-sky-400 border border-sky-850' : 'bg-sky-50 text-sky-700'
                }`}>
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className={`text-sm font-bold font-display ${isDark ? 'text-slate-250' : 'text-slate-850'}`}>{report.title}</h4>
                  <div className="flex flex-wrap gap-3 text-[10px] text-slate-500 mt-1 font-semibold">
                    <span>TYPE: {report.type}</span>
                    <span>•</span>
                    <span>COMPILED: {report.date}</span>
                    <span>•</span>
                    <span>SIZE: {report.size}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                  report.status === 'Ready' 
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-850' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {report.status.toUpperCase()}
                </span>
                <button
                  onClick={() => handleDownloadReport(report.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    isDark
                      ? 'bg-sky-950/40 border-sky-850 text-sky-400 hover:bg-sky-900/60'
                      : 'bg-sky-50 border-sky-100 text-sky-750 hover:bg-sky-100'
                  }`}
                >
                  <Download size={13} />
                  Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Compile New Summary Panel */}
        <div className={`p-5 h-fit ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
          <h3 className={`text-sm font-bold font-display ${isDark ? 'text-slate-200' : 'text-slate-800'} mb-2 flex items-center gap-2`}>
            <Clock size={16} className="text-sky-500" />
            Compile Summary
          </h3>
          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-550'} mb-4`}>Trigger compiling task loops to assemble metrics logs.</p>

          <button
            onClick={() => handleDownloadReport('REP-001')}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
              isDark
                ? 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                : 'bg-sky-600 text-white hover:bg-sky-500'
            }`}
          >
            Generate Summary PDF
          </button>
        </div>
      </div>
    </div>
  );
}
