'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ShieldAlert, RefreshCw, Terminal } from 'lucide-react';

export default function AuditLogs() {
  const { token, theme, auditLogs, setAuditLogs } = useStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1/admin/audit-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAuditLogs(data);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'USER_LOGIN':
        return 'bg-sky-950/40 text-sky-400 border border-sky-850';
      case 'USER_REGISTER':
        return 'bg-indigo-950/40 text-indigo-400 border border-indigo-850';
      case 'DATASET_UPLOAD':
        return 'bg-amber-950/40 text-amber-400 border border-amber-850';
      case 'MODEL_TRAIN_START':
        return 'bg-violet-950/40 text-violet-400 border border-violet-850';
      case 'PREDICTION_RUN':
        return 'bg-emerald-950/40 text-emerald-400 border border-emerald-850';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl font-extrabold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>Security & Audit Logs</h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-550'} mt-1`}>Drill down into corporate access logs, AutoML launches, predictions exports, and database mutations.</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            isDark
              ? 'bg-sky-950/40 border-sky-850 text-sky-400 hover:bg-sky-900/60'
              : 'bg-sky-50 border-sky-100 text-sky-700 hover:bg-sky-100'
          }`}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Sync Log
        </button>
      </div>

      <div className={`p-5 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
        <h3 className={`text-sm font-bold font-display ${isDark ? 'text-slate-200' : 'text-slate-800'} mb-4 flex items-center gap-2`}>
          <ShieldAlert size={16} className="text-red-500 animate-pulse" />
          Enterprise Access Logs Ledger
        </h3>

        <div className={`overflow-x-auto border rounded-lg ${isDark ? 'border-slate-850' : 'border-slate-250'}`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[10px] uppercase font-semibold ${
                isDark ? 'bg-slate-900 border-slate-850 text-slate-450' : 'bg-slate-50 border-slate-200 text-slate-550'
              }`}>
                <th className="p-3">Event ID</th>
                <th className="p-3">Action Event</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Event Details</th>
                <th className="p-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 italic">
                    {loading ? 'Fetching access records...' : 'No system audit logs found.'}
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className={`hover:bg-slate-800/10 ${isDark ? 'text-slate-350 border-slate-850' : 'text-slate-750 border-slate-200'}`}>
                    <td className="p-3 font-mono text-slate-450 text-[10px]">{log.id.slice(0, 10)}...</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[10px] text-slate-455">{log.ip_address}</td>
                    <td className="p-3 font-semibold">{log.details}</td>
                    <td className="p-3 text-right text-slate-500 font-mono text-[10px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
