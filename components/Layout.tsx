
import React from 'react';
import { User, ClipboardList, Stethoscope, RefreshCw } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  view: string;
  setView: (view: 'patient' | 'receptionist' | 'doctor') => void;
  resetAll: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, view, setView, resetAll }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">D</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800">DoQline</h1>
          </div>
          
          <nav className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setView('patient')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'patient' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <User size={16} /> Patient
            </button>
            <button 
              onClick={() => setView('receptionist')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'receptionist' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <ClipboardList size={16} /> Reception
            </button>
            <button 
              onClick={() => setView('doctor')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'doctor' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Stethoscope size={16} /> Doctor
            </button>
          </nav>

          <button 
            onClick={resetAll}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-full"
            title="Reset All Data"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        {children}
      </main>

      <footer className="bg-white border-t py-4">
        <p className="text-center text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} DoQline. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
