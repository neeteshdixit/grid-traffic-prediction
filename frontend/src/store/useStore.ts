import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface Dataset {
  id: string;
  name: string;
  filename: string;
  filepath: string;
  type: 'train' | 'test';
  row_count: number;
  schema_info: any;
  created_at: string;
}

export interface Model {
  id: string;
  name: string;
  algorithm: string;
  r2_score: number;
  mae: number;
  rmse: number;
  is_active: boolean;
  created_at: string;
}

export interface Prediction {
  id: string;
  row_count: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

interface AppState {
  token: string;
  user: User | null;
  currentPage: string;
  theme: 'dark' | 'light';
  datasets: Dataset[];
  models: Model[];
  predictions: Prediction[];
  auditLogs: AuditLog[];
  setToken: (token: string) => void;
  setUser: (user: User | null) => void;
  setCurrentPage: (page: string) => void;
  toggleTheme: () => void;
  setDatasets: (datasets: Dataset[]) => void;
  setModels: (models: Model[]) => void;
  setPredictions: (predictions: Prediction[]) => void;
  setAuditLogs: (logs: AuditLog[]) => void;
}

export const useStore = create<AppState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '',
  user: null,
  currentPage: 'landing', // App starts on Landing Page
  theme: 'dark',
  datasets: [],
  models: [],
  predictions: [],
  auditLogs: [],
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('token', token);
      else localStorage.removeItem('token');
    }
    set({ token });
  },
  setUser: (user) => set({ user }),
  setCurrentPage: (page) => set({ currentPage: page }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setDatasets: (datasets) => set({ datasets }),
  setModels: (models) => set({ models }),
  setPredictions: (predictions) => set({ predictions }),
  setAuditLogs: (auditLogs) => set({ auditLogs }),
}));
