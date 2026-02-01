import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, CommsChannel, BranchConfig, ServiceCategory, Metrics, StatusTransition } from './types';
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

// Laborie Co-operative Credit Union - Vieux Fort Branch
// Based on https://mylaboriecu.com/about/
const BRANCHES: BranchConfig[] = [
  {
    id: 'vieux-fort-branch',
    name: 'Vieux Fort Branch',
    address: 'Vieux Fort, Saint Lucia',
    service: 'Full Service Banking',
    avgTransactionTime: 7,
    gracePeriodMinutes: 10,
    isPaused: false,
    maxInBuilding: 9,
    excludeInServiceFromCapacity: false // Count IN_SERVICE as part of capacity
  }
];

const App: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null);
  const [view, setView] = useState<'customer' | 'receptionist' | 'teller' | 'manager'>('customer');
  const [selectedBranchId] = useState<string>('vieux-fort-branch');
  const [userRole, setUserRole] = useState<'customer' | 'receptionist' | 'teller' | 'manager' | undefined>(undefined);
  const [tellerId, setTellerId] = useState<string>('Teller-1');

  const selectedBranch = BRANCHES.find(b => b.id === selectedBranchId) || BRANCHES[0];

  // Helper: Add audit log entry to ticket
  const addStatusTransition = (ticket: Ticket, fromStatus: TicketStatus, toStatus: TicketStatus, triggeredBy: 'system' | 'reception' | 'teller' | 'customer', reason?: string): StatusTransition[] => {
    const transition: StatusTransition = {
      ticketId: ticket.id,
      fromStatus,
      toStatus,
      timestamp: Date.now(),
      triggeredBy,
      reason
    };
    return [...(ticket.statusHistory || []), transition];
  };

  // Helper: Count current in-building capacity
  const getInBuildingCount = (branchId: string): number => {
    const branchTickets = tickets.filter(t => t.branchId === branchId);
    const inBuilding = branchTickets.filter(t => 
      t.status === TicketStatus.IN_BUILDING
    );
    const inService = selectedBranch.excludeInServiceFromCapacity 
      ? [] 
      : branchTickets.filter(t => t.status === TicketStatus.IN_SERVICE || t.status === TicketStatus.IN_TRANSACTION);
    return inBuilding.length + inService.length;
  };

  // Helper: Send notification to customer
  const sendNotification = async (ticket: Ticket, message: string) => {
    // In production, this would integrate with SMS/WhatsApp API
    console.log(`📱 Notification to ${ticket.name} (${ticket.phone}) via ${ticket.channel}: ${message}`);
    // Simulate notification - in real app, call Twilio, WhatsApp API, etc.
    if (ticket.channel === CommsChannel.SMS) {
      // SMS notification logic here
    } else if (ticket.channel === CommsChannel.WHATSAPP) {
      // WhatsApp notification logic here
    }
  };

  // Helper: Promote next remote customer to eligible for entry
  const promoteNextRemoteCustomer = async (branchId: string) => {
    const branchTickets = tickets.filter(t => t.branchId === branchId);
    const remoteWaiting = branchTickets
      .filter(t => t.status === TicketStatus.REMOTE_WAITING || t.status === TicketStatus.WAITING)
      .sort((a, b) => a.queueNumber - b.queueNumber);
    
    if (remoteWaiting.length > 0) {
      const nextCustomer = remoteWaiting[0];
      const currentCount = getInBuildingCount(branchId);
      const positionInside = currentCount + 1;
      
      // Update status to ELIGIBLE_FOR_ENTRY
      const updates: Partial<Ticket> = {
        status: TicketStatus.ELIGIBLE_FOR_ENTRY,
        eligibleForEntryAt: Date.now(),
        statusHistory: addStatusTransition(
          nextCustomer,
          nextCustomer.status,
          TicketStatus.ELIGIBLE_FOR_ENTRY,
          'system',
          `Capacity opened (${currentCount}→${currentCount + 1})`
        )
      };
      
      await updateTicketInSupabase(nextCustomer.id, updates);
      
      setTickets(prev => prev.map(t => 
        t.id === nextCustomer.id ? { ...t, ...updates } : t
      ));
      
      // Send notification
      await sendNotification(
        nextCustomer,
        `You may enter now; you are now #${positionInside} inside.`
      );
    }
  };

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
    
    localStorage.setItem('queue_user_role', userRole || '');
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
      status: TicketStatus.REMOTE_WAITING, // Start as remote waiting
      branchId,
      serviceCategory,
      joinedAt: Date.now(),
      statusHistory: [{
        ticketId: '',
        fromStatus: TicketStatus.REMOTE_WAITING,
        toStatus: TicketStatus.REMOTE_WAITING,
        timestamp: Date.now(),
        triggeredBy: 'customer',
        reason: 'Joined queue'
      }]
    };
    // Fix the ticketId in statusHistory
    newTicket.statusHistory![0].ticketId = newTicket.id;
    
    // Save to Supabase (with localStorage fallback)
    await saveTicketToSupabase(newTicket);
    
    setTickets(prev => [...prev, newTicket]);
    setCurrentCustomerId(newTicket.id);
  };

  const updateTicketStatus = async (id: string, status: TicketStatus, triggeredBy: 'system' | 'reception' | 'teller' | 'customer' = 'reception', reason?: string) => {
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return;
    
    const fromStatus = ticket.status;
    let updates: Partial<Ticket> = { 
      status,
      statusHistory: addStatusTransition(ticket, fromStatus, status, triggeredBy, reason)
    };
    
    // Handle status-specific timestamps
    if (status === TicketStatus.CALLED || status === TicketStatus.ELIGIBLE_FOR_ENTRY) {
      updates.calledAt = Date.now();
      updates.eligibleForEntryAt = Date.now();
    }
    if (status === TicketStatus.IN_BUILDING) {
      updates.enteredBuildingAt = Date.now();
    }
    if (status === TicketStatus.REMOTE_WAITING && fromStatus === TicketStatus.IN_BUILDING) {
      updates.leftBuildingAt = Date.now();
    }
    if (status === TicketStatus.IN_TRANSACTION || status === TicketStatus.IN_SERVICE) {
      updates.transactionStartedAt = Date.now();
      updates.tellerId = tellerId;
    }
    if (status === TicketStatus.SERVED || status === TicketStatus.COMPLETED) {
      updates.transactionEndedAt = Date.now();
      // Calculate wait time
      if (ticket.enteredBuildingAt) {
        const waitTime = Math.round((Date.now() - ticket.enteredBuildingAt) / 60000);
        updates.waitTimeMinutes = waitTime;
      }
    }
    if (status === TicketStatus.NOT_HERE) updates.bumpedAt = Date.now();
    
    // Capacity Gate Logic: Check if marking as IN_BUILDING
    if (status === TicketStatus.IN_BUILDING) {
      const currentCount = getInBuildingCount(ticket.branchId);
      const maxCapacity = selectedBranch.maxInBuilding;
      
      if (currentCount >= maxCapacity) {
        // Cannot enter - at capacity
        console.warn(`⚠️ Capacity limit reached (${currentCount}/${maxCapacity}). Cannot mark ${ticket.name} as IN_BUILDING.`);
        return; // Don't update status
      }
    }
    
    // Update in Supabase (with localStorage fallback)
    await updateTicketInSupabase(id, updates);
    
    // Update local state
    setTickets(prev => {
      const updated = prev.map(t => {
        if (t.id !== id) return t;
        return { ...t, ...updates };
      });
      
      // Check if capacity opened up (someone left building or moved to service)
      const wasInBuilding = fromStatus === TicketStatus.IN_BUILDING;
      const isLeavingBuilding = status === TicketStatus.REMOTE_WAITING || 
                                status === TicketStatus.IN_SERVICE || 
                                status === TicketStatus.IN_TRANSACTION ||
                                status === TicketStatus.SERVED ||
                                status === TicketStatus.COMPLETED ||
                                status === TicketStatus.REMOVED;
      
      if (wasInBuilding && isLeavingBuilding) {
        // Capacity opened - promote next customer
        setTimeout(() => promoteNextRemoteCustomer(ticket.branchId), 100);
      }
      
      return updated;
    });
  };

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return;
    
    // If status is being updated, add to audit log
    if (updates.status && updates.status !== ticket.status) {
      updates.statusHistory = addStatusTransition(
        ticket,
        ticket.status,
        updates.status,
        'reception',
        updates.auditNotes ? `Manual update: ${updates.auditNotes}` : 'Manual status update'
      );
    }
    
    // Update in Supabase (with localStorage fallback)
    await updateTicketInSupabase(id, updates);
    
    setTickets(prev => {
      const updated = prev.map(t => {
        if (t.id !== id) return t;
        return { ...t, ...updates };
      });
      
      // Check if capacity opened (if status changed from IN_BUILDING)
      if (updates.status && ticket.status === TicketStatus.IN_BUILDING && 
          updates.status !== TicketStatus.IN_BUILDING) {
        setTimeout(() => promoteNextRemoteCustomer(ticket.branchId), 100);
      }
      
      return updated;
    });
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
    <Layout view={view} setView={setView} resetAll={resetAll} userRole={userRole} branchName={selectedBranch.name}>
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
        <ReceptionDashboard 
          tickets={tickets} 
          updateStatus={updateTicketStatus}
          updateTicket={updateTicket}
          branch={selectedBranch}
          inBuildingCount={getInBuildingCount(selectedBranchId)}
          maxInBuilding={selectedBranch.maxInBuilding}
        />
      )}

      {view === 'teller' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
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
