import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, CommsChannel, BranchConfig, ServiceCategory, Metrics } from './types';
import CustomerJoin from './components/CustomerJoin';
import CustomerStatus from './components/CustomerStatus';
import ReceptionDashboard from './components/ReceptionDashboard';
import TellerUI from './components/TellerUI';
import { Layout } from './components/Layout';
import { 
  loadTicketsFromSupabase, 
  saveTicketToSupabase, 
  updateTicketInSupabase, 
  saveAllTicketsToSupabase 
} from './supabase';

// Laborie Co-operative Credit Union - Multi-branch configuration
// Based on https://mylaboriecu.com/about/
const BRANCHES: BranchConfig[] = [
  {
    id: 'laborie-branch',
    name: 'Laborie Branch',
    address: 'Allan Louisy Street, Laborie, Saint Lucia',
    service: 'Full Service Banking',
    avgTransactionTime: 8,
    gracePeriodMinutes: 10,
    isPaused: false
  },
  {
    id: 'vieux-fort-branch',
    name: 'Vieux Fort Branch',
    address: 'Vieux Fort, Saint Lucia',
    service: 'Full Service Banking',
    avgTransactionTime: 7,
    gracePeriodMinutes: 10,
    isPaused: false
  },
  {
    id: 'castries-branch',
    name: 'Castries Branch',
    address: 'Castries, Saint Lucia',
    service: 'Full Service Banking',
    avgTransactionTime: 8,
    gracePeriodMinutes: 10,
    isPaused: false
  }
];

const App: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null);
  const [view, setView] = useState<'customer' | 'receptionist' | 'teller' | 'manager'>('customer');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(BRANCHES[0].id);
  const [userRole, setUserRole] = useState<'customer' | 'receptionist' | 'teller' | 'manager' | undefined>(undefined);
  const [tellerId, setTellerId] = useState<string>('Teller-1');

  const selectedBranch = BRANCHES.find(b => b.id === selectedBranchId) || BRANCHES[0];

  // Load tickets from Supabase (with localStorage fallback)
  useEffect(() => {
    const loadTickets = async () => {
      const loadedTickets = await loadTicketsFromSupabase();
      setTickets(loadedTickets);
    };
    loadTickets();
    
    // Load current customer ID from localStorage
    const customer = localStorage.getItem('queue_customer_id');
    if (customer) setCurrentCustomerId(customer);
    
    // Load user role and branch selection (don't load from localStorage to show all buttons by default)
    // const savedRole = localStorage.getItem('queue_user_role') as typeof userRole;
    // if (savedRole) setUserRole(savedRole);
    const savedBranch = localStorage.getItem('queue_selected_branch');
    if (savedBranch) setSelectedBranchId(savedBranch);
  }, []);

  // Save tickets to Supabase when they change
  useEffect(() => {
    if (tickets.length > 0) {
      saveAllTicketsToSupabase(tickets);
    }
    
    // Always save customer ID to localStorage for quick access
    if (currentCustomerId) {
      localStorage.setItem('queue_customer_id', currentCustomerId);
    } else {
      localStorage.removeItem('queue_customer_id');
    }
    
    localStorage.setItem('queue_user_role', userRole);
    localStorage.setItem('queue_selected_branch', selectedBranchId);
  }, [tickets, currentCustomerId, userRole, selectedBranchId]);

  const addTicket = async (
    name: string, 
    phone: string, 
    channel: CommsChannel, 
    branchId: string,
    memberId?: string,
    serviceCategory?: ServiceCategory
  ) => {
    // Get next queue number for this branch
    const branchTickets = tickets.filter(t => t.branchId === branchId);
    const nextNum = branchTickets.length > 0 
      ? Math.max(...branchTickets.map(t => t.queueNumber)) + 1 
      : 1;
    
    const newTicket: Ticket = {
      id: Math.random().toString(36).substr(2, 9),
      queueNumber: nextNum,
      name,
      phone,
      memberId,
      channel,
      status: TicketStatus.WAITING,
      branchId,
      serviceCategory,
      joinedAt: Date.now()
    };
    
    // Save to Supabase (with localStorage fallback)
    await saveTicketToSupabase(newTicket);
    
    setTickets(prev => [...prev, newTicket]);
    setCurrentCustomerId(newTicket.id);
  };

  const updateTicketStatus = async (id: string, status: TicketStatus) => {
    let updates: Partial<Ticket> = { status };
    if (status === TicketStatus.CALLED) updates.calledAt = Date.now();
    if (status === TicketStatus.IN_TRANSACTION) {
      updates.transactionStartedAt = Date.now();
      updates.tellerId = tellerId;
    }
    if (status === TicketStatus.SERVED) {
      updates.transactionEndedAt = Date.now();
      // Calculate wait time
      const ticket = tickets.find(t => t.id === id);
      if (ticket && ticket.calledAt) {
        const waitTime = Math.round((Date.now() - ticket.joinedAt) / 60000);
        updates.waitTimeMinutes = waitTime;
      }
    }
    if (status === TicketStatus.NOT_HERE) updates.bumpedAt = Date.now();
    
    // Update in Supabase (with localStorage fallback)
    await updateTicketInSupabase(id, updates);
    
    setTickets(prev => prev.map(t => {
      if (t.id !== id) return t;
      return { ...t, ...updates };
    }));
  };

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    // Update in Supabase (with localStorage fallback)
    await updateTicketInSupabase(id, updates);
    
    setTickets(prev => prev.map(t => {
      if (t.id !== id) return t;
      return { ...t, ...updates };
    }));
  };

  const submitFeedback = async (id: string, stars: number) => {
    // Update in Supabase (with localStorage fallback)
    await updateTicketInSupabase(id, { feedbackStars: stars });
    
    setTickets(prev => prev.map(t => t.id === id ? { ...t, feedbackStars: stars } : t));
  };

  const pauseQueue = () => {
    const branch = BRANCHES.find(b => b.id === selectedBranchId);
    if (branch) {
      // In a real app, this would update the branch config in the database
      branch.isPaused = !branch.isPaused;
      setSelectedBranchId(selectedBranchId); // Trigger re-render
    }
  };

  const flagNoShow = async (id: string) => {
    await updateTicket(id, { isNoShow: true });
    await updateTicketStatus(id, TicketStatus.NOT_HERE);
  };

  const calculateMetrics = (branchId?: string): Metrics => {
    const relevantTickets = branchId 
      ? tickets.filter(t => t.branchId === branchId && t.status === TicketStatus.SERVED)
      : tickets.filter(t => t.status === TicketStatus.SERVED);
    
    const totalServed = relevantTickets.length;
    const waitTimes = relevantTickets
      .filter(t => t.waitTimeMinutes !== undefined)
      .map(t => t.waitTimeMinutes!);
    const avgWaitTime = waitTimes.length > 0
      ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : 0;
    
    const transactionTimes = relevantTickets
      .filter(t => t.transactionStartedAt && t.transactionEndedAt)
      .map(t => Math.round((t.transactionEndedAt! - t.transactionStartedAt!) / 60000));
    const avgTransactionTime = transactionTimes.length > 0
      ? Math.round(transactionTimes.reduce((a, b) => a + b, 0) / transactionTimes.length)
      : 0;
    
    const noShowCount = tickets.filter(t => 
      (branchId ? t.branchId === branchId : true) && t.isNoShow
    ).length;
    
    // Peak hours analysis
    const hourCounts: { [hour: number]: number } = {};
    relevantTickets.forEach(t => {
      const hour = new Date(t.joinedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Service category breakdown
    const categoryCounts: { [category: string]: number } = {};
    relevantTickets.forEach(t => {
      if (t.serviceCategory) {
        categoryCounts[t.serviceCategory] = (categoryCounts[t.serviceCategory] || 0) + 1;
      }
    });
    const serviceCategoryBreakdown = Object.entries(categoryCounts)
      .map(([category, count]) => ({ 
        category: category as ServiceCategory, 
        count 
      }))
      .sort((a, b) => b.count - a.count);
    
    return {
      totalServed,
      averageWaitTime: avgWaitTime,
      averageTransactionTime: avgTransactionTime,
      noShowCount,
      peakHours,
      serviceCategoryBreakdown
    };
  };

  const resetAll = () => {
    setTickets([]);
    setCurrentCustomerId(null);
    localStorage.clear();
  };

  const currentTicket = tickets.find(t => t.id === currentCustomerId);
  const currentBranchTickets = tickets.filter(t => t.branchId === selectedBranchId);
  const metrics = calculateMetrics(selectedBranchId);

  return (
    <Layout view={view} setView={setView} resetAll={resetAll} userRole={userRole}>
      {view === 'customer' && (
        !currentTicket ? (
          <CustomerJoin branches={BRANCHES.filter(b => !b.isPaused)} onJoin={addTicket} />
        ) : (
          <CustomerStatus 
            ticket={currentTicket} 
            allTickets={currentBranchTickets} 
            branch={selectedBranch} 
            onCancel={() => setCurrentCustomerId(null)}
            onSubmitFeedback={submitFeedback}
          />
        )
      )}

      {view === 'receptionist' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg"
            >
              {BRANCHES.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <ReceptionDashboard 
            tickets={tickets} 
            updateStatus={updateTicketStatus}
            updateTicket={updateTicket}
            branch={selectedBranch}
          />
        </div>
      )}

      {view === 'teller' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg"
            >
              {BRANCHES.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={tellerId}
              onChange={(e) => setTellerId(e.target.value)}
              placeholder="Teller ID"
              className="px-4 py-2 border border-slate-200 rounded-lg"
            />
          </div>
          <TellerUI 
            tickets={tickets} 
            updateStatus={updateTicketStatus}
            branch={selectedBranch}
            tellerId={tellerId}
            onPauseQueue={pauseQueue}
            onFlagNoShow={flagNoShow}
          />
        </div>
      )}

      {view === 'manager' && (
        <div className="space-y-6">
          <h2 className="text-3xl font-black text-slate-800 mb-6">Manager Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-sm text-slate-500 font-bold uppercase mb-2">Total Served</p>
              <p className="text-3xl font-black text-slate-800">{metrics.totalServed}</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-sm text-slate-500 font-bold uppercase mb-2">Avg Wait Time</p>
              <p className="text-3xl font-black text-slate-800">{metrics.averageWaitTime} min</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-sm text-slate-500 font-bold uppercase mb-2">Avg Transaction</p>
              <p className="text-3xl font-black text-slate-800">{metrics.averageTransactionTime} min</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-sm text-slate-500 font-bold uppercase mb-2">No-Shows</p>
              <p className="text-3xl font-black text-slate-800">{metrics.noShowCount}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Peak Hours</h3>
              <div className="space-y-2">
                {metrics.peakHours.map(({ hour, count }) => (
                  <div key={hour} className="flex items-center justify-between">
                    <span className="text-slate-600">{hour}:00</span>
                    <span className="font-bold text-slate-800">{count} customers</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Service Breakdown</h3>
              <div className="space-y-2">
                {metrics.serviceCategoryBreakdown.map(({ category, count }) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-slate-600">{category.replace('_', ' ')}</span>
                    <span className="font-bold text-slate-800">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => {
                const data = JSON.stringify(metrics, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `metrics-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
            >
              Export Metrics (JSON)
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
