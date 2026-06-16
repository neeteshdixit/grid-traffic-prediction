'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart4,
  Database,
  FileText,
  GitFork,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MoonStar,
  PlayCircle,
  Settings,
  ShieldAlert,
  Sparkles,
  SunMedium,
  X,
  Car,
} from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Sidebar() {
  const { currentPage, setCurrentPage, theme, toggleTheme, user, setToken, setUser } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDark = theme === 'dark';

  const menuItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'parking_intel', label: 'Parking Intelligence', icon: Car },
    { id: 'congestion', label: 'Congestion Impact', icon: ShieldAlert },
    { id: 'enforcement', label: 'Enforcement Strategy', icon: Sparkles },
    { id: 'datasets', label: 'Dataset Studio', icon: Database },
    { id: 'features', label: 'Feature Engineering', icon: GitFork },
    { id: 'training', label: 'Model Training', icon: PlayCircle },
    { id: 'predictions', label: 'Prediction Center', icon: BarChart4 },
    { id: 'explain', label: 'Explainability', icon: HelpCircle },
    { id: 'analytics', label: 'Analytics', icon: BarChart4 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'audit', label: 'Audit Logs', icon: ShieldAlert, adminOnly: true },
  ];

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setCurrentPage('landing');
    setMobileOpen(false);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setMobileOpen(false);
  };

  const NavList = ({ compact = false }: { compact?: boolean }) => (
    <div className="space-y-1">
      {menuItems.map((item) => {
        if (item.adminOnly && user?.role !== 'admin') return null;
        const Icon = item.icon;
        const isActive = currentPage === item.id;

        return (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.id)}
            className={`group relative flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition ${
              isActive
                ? isDark
                  ? 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200'
                  : 'border-cyan-200 bg-cyan-50 text-cyan-700'
                : isDark
                  ? 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-100'
                  : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            } ${compact ? 'justify-center px-2' : ''}`}
          >
            <Icon size={16} className={isActive ? 'text-cyan-300' : 'opacity-70'} />
            {!compact && <span className="font-medium">{item.label}</span>}
            {isActive && !compact && <span className="ml-auto h-2 w-2 rounded-full bg-cyan-400" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={`relative z-40 w-full shrink-0 lg:w-[19rem] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      <div className={`flex items-center justify-between border-b px-4 py-4 lg:hidden ${isDark ? 'border-white/10 bg-[#050814]/90' : 'border-slate-200 bg-white/90'}`}>
        <button
          onClick={() => handleNavigate('dashboard')}
          className="flex items-center gap-3 text-left"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-sm font-black tracking-[0.18em] text-cyan-300">
            TA
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-[0.18em] text-cyan-300">TRAFFICAI</span>
            <span className={`block text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Demand prediction console</span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${
              isDark ? 'border-white/10 bg-white/5 text-slate-100' : 'border-slate-200 bg-white text-slate-700'
            }`}
            aria-label="Toggle theme"
          >
            {isDark ? <SunMedium size={16} /> : <MoonStar size={16} />}
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${
              isDark ? 'border-white/10 bg-white/5 text-slate-100' : 'border-slate-200 bg-white text-slate-700'
            }`}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      <aside
        className={`hidden min-h-screen flex-col justify-between border-r px-4 py-4 lg:sticky lg:top-0 lg:flex ${
          isDark ? 'border-white/10 bg-[#050814]/70' : 'border-slate-200 bg-white/80'
        } backdrop-blur-xl`}
      >
        <div className="space-y-6">
          <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-sm font-black tracking-[0.18em] text-cyan-300">
              TA
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-[0.18em] text-cyan-300">TRAFFICAI</span>
              <span className={`block text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Demand prediction console</span>
            </span>
          </button>

          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/8 p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              <Sparkles size={13} />
              Workspace status
            </div>
            <div className="mt-2 text-sm font-medium">System online and ready for scoring.</div>
            <div className={`mt-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Use the tabs below to move through the workflow.</div>
          </div>

          <NavList />
        </div>

        <div className="space-y-4 border-t border-white/10 pt-4">
          <button
            onClick={toggleTheme}
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
              isDark
                ? 'border-white/10 bg-white/5 text-slate-100 hover:border-cyan-400/25'
                : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-200'
            }`}
          >
            <span className="flex items-center gap-2">
              {isDark ? <MoonStar size={16} /> : <SunMedium size={16} />}
              {isDark ? 'Dark mode' : 'Light mode'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Active</span>
          </button>

          <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
            <div className="text-xs font-semibold">{user?.full_name || 'Guest user'}</div>
            <div className={`mt-1 text-[11px] uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              {user?.role === 'admin' ? 'Administrator' : 'Data scientist'}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/15 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-500/30 hover:bg-rose-500/15"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/55 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu overlay"
            />

            <motion.aside
              key="drawer"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
              className={`fixed inset-y-0 left-0 z-[60] w-[86vw] max-w-sm border-r px-4 py-4 lg:hidden ${
                isDark ? 'border-white/10 bg-[#050814]/98' : 'border-slate-200 bg-white/98'
              } backdrop-blur-xl`}
            >
              <div className="flex items-center justify-between">
                <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-sm font-black tracking-[0.18em] text-cyan-300">
                    TA
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-semibold tracking-[0.18em] text-cyan-300">TRAFFICAI</span>
                    <span className={`block text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Demand prediction console</span>
                  </span>
                </button>
                <button
                  onClick={() => setMobileOpen(false)}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${
                    isDark ? 'border-white/10 bg-white/5 text-slate-100' : 'border-slate-200 bg-white text-slate-700'
                  }`}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6">
                <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/8 p-4">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                    <Sparkles size={13} />
                    Workspace status
                  </div>
                  <div className="mt-2 text-sm font-medium">System online and ready for scoring.</div>
                </div>
              </div>

              <div className="mt-6">
                <NavList />
              </div>

              <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
                <button
                  onClick={toggleTheme}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-slate-100 hover:border-cyan-400/25'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isDark ? <MoonStar size={16} /> : <SunMedium size={16} />}
                    {isDark ? 'Dark mode' : 'Light mode'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Active</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/15 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-500/30 hover:bg-rose-500/15"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

