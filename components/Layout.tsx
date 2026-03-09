
import React from 'react';
import { User, ClipboardList, Stethoscope, RefreshCw, BarChart3, HeartPulse } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  view: string;
  setView: (view: 'customer' | 'receptionist' | 'teller' | 'manager') => void;
  resetAll: () => void;
  userRole?: 'customer' | 'receptionist' | 'teller' | 'manager';
  branchName?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, view, setView, resetAll, userRole, branchName }) => {
  return (
    <div className="flex flex-col" style={{ height: '100vh' }}>
      <header className="bg-white border-b sticky top-0 z-50 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <HeartPulse size={22} className="text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-slate-800 leading-tight">DocQline Medical</h1>
              {branchName && (
                <p className="text-xs text-slate-500 leading-tight">{branchName}</p>
              )}
            </div>
          </div>

          <nav className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setView('customer')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'customer' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
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
              onClick={() => setView('teller')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'teller' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Stethoscope size={16} /> Consultation
            </button>
            <button
              onClick={() => setView('manager')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'manager' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <BarChart3 size={16} /> Analytics
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

      <main className="flex-1 max-w-6xl mx-auto w-full p-2 md:p-4 overflow-hidden flex flex-col" style={{ minHeight: 0, height: 'calc(100vh - 64px - 80px)' }}>
        <div className="flex-1 overflow-hidden min-h-0">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t py-4 flex-shrink-0">
        <p className="text-center text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} DocQline Medical Centre. All rights reserved.
        </p>
        <p className="text-center text-slate-500 text-xs mt-1 font-semibold">
          Your Health, Our Priority.
        </p>
        <p className="text-center mt-2">
          <button
            onClick={() => {
              const event = new CustomEvent('start-tour');
              window.dispatchEvent(event);
            }}
            className="text-xs text-blue-600 hover:text-blue-700 underline"
          >
            Help / Tour
          </button>
        </p>
      </footer>
    </div>
  );
};
