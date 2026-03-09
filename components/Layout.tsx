
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

const NAV_ITEMS = [
  { id: 'customer',     label: 'Patient',      icon: User },
  { id: 'receptionist', label: 'Reception',    icon: ClipboardList },
  { id: 'teller',       label: 'Consultation', icon: Stethoscope },
  { id: 'manager',      label: 'Analytics',    icon: BarChart3 },
] as const;

export const Layout: React.FC<LayoutProps> = ({
  children, view, setView, resetAll, branchName,
}) => {
  return (
    <div className="flex flex-col" style={{ height: '100vh', background: '#F5F5F7' }}>

      {/* ── Glass Navigation Bar ───────────────────────────── */}
      <header
        className="sticky top-0 z-50 flex-shrink-0"
        style={{
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between" style={{ height: '60px' }}>

          {/* Wordmark */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="h-8 w-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(145deg, #0071E3 0%, #34AADC 100%)' }}
            >
              <HeartPulse size={17} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-none min-w-0">
              <span className="block text-[15px] font-semibold text-[#1D1D1F] tracking-tight">DocQline</span>
              {branchName && (
                <span className="block text-[11px] text-[#8E8E93] mt-[2px] truncate">{branchName}</span>
              )}
            </div>
          </div>

          {/* Segmented Control Nav */}
          <nav
            className="flex items-center gap-[2px] p-[3px] rounded-[11px]"
            style={{ background: 'rgba(0,0,0,0.05)' }}
          >
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = view === id;
              return (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-all duration-200 select-none ${
                    active
                      ? 'text-[#0071E3]'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                  style={active ? {
                    background: '#FFFFFF',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.10), 0 0 0 0.5px rgba(0,0,0,0.06)',
                  } : undefined}
                >
                  <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Reset */}
          <button
            onClick={resetAll}
            className="p-2 rounded-full text-[#AEAEB2] hover:text-[#FF3B30] hover:bg-[#FFF1F0] transition-all"
            title="Reset All Data"
          >
            <RefreshCw size={16} />
          </button>

        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────── */}
      <main
        className={`flex-1 max-w-6xl mx-auto w-full px-4 py-4 flex flex-col ${
          view === 'receptionist' ? 'overflow-hidden' : 'overflow-y-auto'
        }`}
        style={{ minHeight: 0, height: 'calc(100vh - 60px - 40px)' }}
      >
        <div className={`flex-1 min-h-0 ${view === 'receptionist' ? 'overflow-hidden' : ''}`}>
          {children}
        </div>
      </main>

      {/* ── Minimal Footer ─────────────────────────────────── */}
      <footer
        className="flex-shrink-0 flex items-center justify-between px-6"
        style={{
          height: '40px',
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <span className="text-[11px] text-[#AEAEB2]">
          © {new Date().getFullYear()} DocQline Medical Centre
        </span>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('start-tour'))}
          className="text-[11px] font-medium text-[#0071E3] hover:text-[#0077ED] transition-colors"
        >
          Help & Tour
        </button>
      </footer>

    </div>
  );
};
