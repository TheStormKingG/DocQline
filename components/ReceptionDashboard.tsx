import React, { useState } from 'react';
import { Ticket, TicketStatus, BranchConfig } from '../types';
import { UserCheck, UserX, ArrowRight, FileText, LogIn, LogOut, Users } from 'lucide-react';

interface ReceptionDashboardProps {
  tickets: Ticket[];
  updateStatus: (id: string, status: TicketStatus, triggeredBy?: 'system' | 'reception' | 'teller' | 'customer', reason?: string) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  branch: BranchConfig;
  inBuildingCount: number;
  maxInBuilding: number;
}

const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({ tickets, updateStatus, updateTicket, branch, inBuildingCount, maxInBuilding }) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [auditNote, setAuditNote] = useState('');
  
  // Filter tickets for this branch
  const branchTickets = tickets.filter(t => t.branchId === branch.id);
  
  // New status-based filtering
  const remoteWaiting = branchTickets.filter(t => 
    t.status === TicketStatus.REMOTE_WAITING || t.status === TicketStatus.WAITING
  ).sort((a, b) => a.queueNumber - b.queueNumber);
  
  const eligibleForEntry = branchTickets.filter(t => 
    t.status === TicketStatus.ELIGIBLE_FOR_ENTRY || t.status === TicketStatus.CALLED
  ).sort((a, b) => a.queueNumber - b.queueNumber);
  
  const inBuilding = branchTickets.filter(t => 
    t.status === TicketStatus.IN_BUILDING || t.status === TicketStatus.ARRIVED
  ).sort((a, b) => a.queueNumber - b.queueNumber);
  
  const inService = branchTickets.filter(t => 
    t.status === TicketStatus.IN_SERVICE || t.status === TicketStatus.IN_TRANSACTION
  );
  
  // Legacy support
  const waiting = remoteWaiting;
  const called = eligibleForEntry;
  const inTransaction = inService;
  
  const confirmedNext = branchTickets.find(t => 
    t.status === TicketStatus.ELIGIBLE_FOR_ENTRY || t.status === TicketStatus.ARRIVED
  );
  const nextUp = remoteWaiting[0];
  
  // Handle mark as entered (IN_BUILDING)
  const handleMarkEntered = async (ticketId: string) => {
    if (inBuildingCount >= maxInBuilding) {
      alert(`⚠️ Building at capacity (${inBuildingCount}/${maxInBuilding}). Cannot mark as entered.`);
      return;
    }
    await updateStatus(ticketId, TicketStatus.IN_BUILDING, 'reception', 'Marked as entered by reception');
  };
  
  // Handle mark as left (back to REMOTE_WAITING)
  const handleMarkLeft = async (ticketId: string) => {
    await updateStatus(ticketId, TicketStatus.REMOTE_WAITING, 'reception', 'Marked as left by reception');
  };

  const handleAddAuditNote = () => {
    if (selectedTicket && auditNote.trim()) {
      const existingNotes = selectedTicket.auditNotes || '';
      const newNotes = existingNotes 
        ? `${existingNotes}\n[${new Date().toLocaleString()}] ${auditNote}`
        : `[${new Date().toLocaleString()}] ${auditNote}`;
      updateTicket(selectedTicket.id, { auditNotes: newNotes });
      setAuditNote('');
      setSelectedTicket(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 h-full overflow-hidden" data-tour="reception-dashboard">
      {/* Top Row: Header, In-Building, and Now Serving */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 flex-shrink-0">
        {/* Left Side: Header and In-Building */}
        <div className="lg:col-span-8 flex flex-col gap-1.5">
          {/* In-Building Capacity Grid - 2 Rows of 5, 2x Bigger */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 flex-shrink-0 p-2" style={{ height: 'calc((100vh - 200px) * 0.30)' }} data-tour="capacity-gate">
            <div className="flex items-center justify-between mb-2 h-5">
              <h3 className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">In-Building ({inBuildingCount}/10)</h3>
            </div>
            <div 
              className="grid gap-1.5" 
              style={{ 
                gridTemplateColumns: 'repeat(5, 1fr)',
                gridTemplateRows: 'repeat(2, 1fr)',
                height: 'calc(100% - 25px)',
                width: '100%'
              }}
            >
              {Array.from({ length: 10 }).map((_, index) => {
                const spotNumber = index + 1;
                const sortedInBuilding = [...inBuilding].sort((a, b) => a.queueNumber - b.queueNumber);
                const customerInSpot = sortedInBuilding[index];
                const isEmpty = spotNumber > maxInBuilding;
                
                return (
                  <div
                    key={index}
                    onClick={() => customerInSpot && setSelectedTicket(customerInSpot)}
                    className={`rounded-md flex flex-col items-center justify-center border-2 transition-all ${
                      customerInSpot 
                        ? 'bg-green-50 border-green-300 cursor-pointer hover:border-green-400' 
                        : 'border-dashed border-slate-200 bg-slate-50'
                    }`}
                    style={{ width: '100%', height: '100%', minHeight: 0 }}
                  >
                    {customerInSpot ? (
                      <>
                        <span className="text-lg font-black text-green-700">{customerInSpot.queueNumber}</span>
                        <span className="text-[10px] uppercase font-bold tracking-tighter text-green-600 mt-1 leading-none">
                          {customerInSpot.name.split(' ')[0].substring(0, 6)}
                </span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-300 text-base font-black">#{spotNumber}</span>
                        <span className="text-[10px] uppercase font-bold tracking-tighter text-slate-300 mt-1 leading-none">
                          {isEmpty ? '' : spotNumber === 1 ? '(NEXT)' : 'Empty'}
                        </span>
                      </>
            )}
          </div>
                );
              })}
          </div>
        </div>
      </div>

        {/* Action Sidebar - Dynamic Height */}
        <div className="lg:col-span-4 flex flex-col gap-1.5">
        <div className="bg-slate-900 text-white rounded-xl relative overflow-hidden flex-shrink-0 p-3" style={{ height: 'calc((100vh - 200px) * 0.30)' }}>
          <div className="relative z-10 h-full flex flex-col">
            <h3 className="text-slate-400 text-[9px] font-bold uppercase mb-2 tracking-widest flex-shrink-0">Now Serving</h3>
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              {inTransaction.length > 0 ? (
                <>
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-xl font-black mb-1 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                    {inTransaction[0].queueNumber}
                  </div>
                  <p className="text-xs font-bold mb-0.5">{inTransaction[0].name}</p>
                  {inTransaction[0].memberId && (
                    <p className="text-[9px] text-green-300 mb-0.5">ID: {inTransaction[0].memberId}</p>
                  )}
                  {inTransaction[0].tellerId && (
                    <p className="text-[9px] text-green-300 mb-0.5">Teller: {inTransaction[0].tellerId}</p>
                  )}
                </>
              ) : (
                <>
                  <div className="w-12 h-12 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-700 mb-1">
                    <UserCheck size={16} />
                  </div>
                  <p className="text-slate-500 italic text-[9px]">No active service</p>
                </>
              )}
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-600 rounded-full blur-[40px] opacity-20" />
        </div>

        </div>
      </div>

      {/* Remote Waiting Queue - Full Width Below, 5 Rows of 10 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 flex-1 flex flex-col min-h-0 p-2" style={{ minHeight: 0, width: '100%' }}>
        <h3 className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1.5 flex-shrink-0">
          Remote ({remoteWaiting.length})
        </h3>
        {remoteWaiting.length > 0 ? (
          <div 
            className="grid gap-0.5 overflow-y-auto flex-1 min-h-0"
            style={{ 
              gridTemplateColumns: 'repeat(10, 1fr)',
              gridTemplateRows: 'repeat(5, 1fr)',
              width: '100%'
            }}
          >
            {Array.from({ length: 50 }).map((_, index) => {
              const spotNumber = index + 11; // Start numbering at 11
              const ticket = remoteWaiting[index];
              if (!ticket) {
                return (
                  <div 
                    key={`empty-${index}`}
                    className="rounded-sm flex flex-col items-center justify-center border border-dashed border-slate-200 bg-slate-50"
                    style={{ width: '100%', height: '100%', minHeight: 0 }}
                  >
                    <span className="text-slate-200 text-[10px] font-black">#{spotNumber}</span>
                  </div>
                );
              }
              return (
                <div 
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="rounded-sm flex flex-col items-center justify-center border border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:bg-slate-100 transition-all cursor-pointer"
                  style={{ width: '100%', height: '100%', minHeight: 0 }}
                >
                  <span className="text-[10px] font-black">{ticket.queueNumber}</span>
                  <span className="text-[6px] uppercase font-bold tracking-tighter opacity-70 mt-0.5 leading-none">
                    {ticket.name.split(' ')[0].substring(0, 4)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div 
            className="grid gap-0.5 flex-1"
            style={{ 
              gridTemplateColumns: 'repeat(10, 1fr)',
              gridTemplateRows: 'repeat(5, 1fr)',
              width: '100%'
            }}
          >
            {Array.from({ length: 50 }).map((_, index) => {
              const spotNumber = index + 11; // Start numbering at 11
              return (
                <div 
                  key={`empty-${index}`}
                  className="rounded-sm flex flex-col items-center justify-center border border-dashed border-slate-200 bg-slate-50"
                  style={{ width: '100%', height: '100%', minHeight: 0 }}
                >
                  <span className="text-slate-200 text-[10px] font-black">#{spotNumber}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Audit Notes Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 mb-2">Add Audit Note</h3>
            <p className="text-slate-600 mb-4">Ticket #{selectedTicket.queueNumber} - {selectedTicket.name}</p>
            
            {selectedTicket.auditNotes && (
              <div className="mb-4 p-4 bg-slate-50 rounded-xl max-h-40 overflow-y-auto">
                <p className="text-xs text-slate-500 font-bold mb-2">Existing Notes:</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedTicket.auditNotes}</p>
              </div>
            )}
            
            <textarea
              value={auditNote}
              onChange={(e) => setAuditNote(e.target.value)}
              placeholder="Enter audit note or exception details..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all mb-4"
              rows={4}
            />
            
          <div className="flex gap-3">
              <button
                onClick={handleAddAuditNote}
                disabled={!auditNote.trim()}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FileText size={18} /> Add Note
              </button>
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setAuditNote('');
                }}
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionDashboard;
