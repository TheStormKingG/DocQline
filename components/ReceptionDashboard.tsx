import React, { useState } from 'react';
import { Ticket, TicketStatus, BranchConfig } from '../types';
import { UserCheck, UserX, ArrowRight, Info, FileText, Building2, LogIn, LogOut, Users } from 'lucide-react';

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      {/* Queue Grid */}
      <div className="lg:col-span-8 space-y-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 size={20} className="text-slate-500" />
            <h2 className="text-xl font-bold">
              Queue Overview - {branch.name}
              <span className="text-sm font-normal text-slate-400 ml-2">
                ({remoteWaiting.length + eligibleForEntry.length} Active)
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <Users size={20} className="text-blue-600" />
            <div>
              <p className="text-xs text-blue-600 font-bold uppercase">Inside</p>
              <p className="text-lg font-black text-blue-700">
                {inBuildingCount}/{maxInBuilding}
              </p>
            </div>
          </div>
        </div>
        
        {/* In-Building Capacity Grid - 9 Spots */}
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">In-Building Capacity ({inBuildingCount}/{maxInBuilding})</h3>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              inBuildingCount >= maxInBuilding 
                ? 'bg-red-100 text-red-700' 
                : inBuildingCount >= maxInBuilding * 0.8
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {inBuildingCount >= maxInBuilding ? 'AT CAPACITY' : `${maxInBuilding - inBuildingCount} spots available`}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: maxInBuilding }).map((_, index) => {
              const spotNumber = index + 1;
              // Get customer for this spot (sorted by queue number, take first 9)
              const sortedInBuilding = [...inBuilding].sort((a, b) => a.queueNumber - b.queueNumber);
              const customerInSpot = sortedInBuilding[index];
              
              return (
                <div
                  key={index}
                  onClick={() => customerInSpot && setSelectedTicket(customerInSpot)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
                    customerInSpot 
                      ? 'bg-green-50 border-green-300 cursor-pointer hover:border-green-400' 
                      : 'border-dashed border-slate-200 bg-slate-50'
                  }`}
                >
                  {customerInSpot ? (
                    <>
                      <span className="text-2xl font-black text-green-700">{customerInSpot.queueNumber}</span>
                      <span className="text-[10px] uppercase font-bold tracking-tighter text-green-600 mt-1">
                        {customerInSpot.name.split(' ')[0]}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-300 text-xl font-black">#{spotNumber}</span>
                      <span className="text-[10px] uppercase font-bold tracking-tighter text-slate-300 mt-1">
                        Empty
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {inBuilding.length > 0 && (
            <div className="mt-4 space-y-2">
              {inBuilding.map(t => (
                <div key={t.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                      {t.queueNumber}
                    </div>
                    <div>
                      <p className="font-bold text-green-900 text-sm">{t.name}</p>
                      {t.enteredBuildingAt && (
                        <p className="text-xs text-green-600">
                          Entered {new Date(t.enteredBuildingAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkLeft(t.id)}
                    className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                    title="Mark as Left"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Remote Waiting Queue */}
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
            Remote Waiting Queue ({remoteWaiting.length})
          </h3>
          {remoteWaiting.length > 0 ? (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {remoteWaiting.map(ticket => (
                <div 
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center border-2 border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <span className="text-xl font-black">{ticket.queueNumber}</span>
                  <span className="text-[10px] uppercase font-bold tracking-tighter opacity-70 mt-1">
                    {ticket.name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-300 italic text-sm text-center py-8">No customers in remote waiting queue.</p>
          )}
        </div>


        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-widest">Eligible for Entry</h3>
            {eligibleForEntry.length > 0 ? (
              <ul className="space-y-4">
                {eligibleForEntry.map(t => (
                  <li key={t.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-bold">
                        {t.queueNumber}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{t.name}</p>
                        {t.memberId && <p className="text-xs text-slate-500">ID: {t.memberId}</p>}
                        {t.eligibleForEntryAt && (
                          <p className="text-xs text-slate-400">
                            Eligible {new Date(t.eligibleForEntryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkEntered(t.id)}
                      disabled={inBuildingCount >= maxInBuilding}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      title={inBuildingCount >= maxInBuilding ? "Building at capacity" : "Mark as Entered"}
                    >
                      <LogIn size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-300 italic text-sm">No customers eligible for entry.</p>
            )}
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-widest">Calling Now</h3>
            {called.length > 0 ? (
              <ul className="space-y-4">
                {called.map(t => (
                  <li key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-bold">
                        {t.queueNumber}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{t.name}</p>
                        {t.memberId && <p className="text-xs text-slate-500">ID: {t.memberId}</p>}
                        <p className="text-xs text-slate-400">Called {new Date(t.calledAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleMarkEntered(t.id)}
                        disabled={inBuildingCount >= maxInBuilding}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={inBuildingCount >= maxInBuilding ? "Building at capacity" : "Mark as Entered"}
                      >
                        <LogIn size={18} />
                      </button>
                      <button 
                        onClick={() => updateStatus(t.id, TicketStatus.REMOTE_WAITING, 'reception', 'No show')}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        title="No Show"
                      >
                        <UserX size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-300 italic text-sm">No customers currently in "Called" state.</p>
            )}
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-widest">In Transaction</h3>
            {inTransaction.length > 0 ? (
              <ul className="space-y-4">
                {inTransaction.map(t => (
                  <li key={t.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
                      {t.queueNumber}
                    </div>
                    <div>
                      <p className="font-bold text-blue-900">{t.name}</p>
                      {t.tellerId && <p className="text-xs text-blue-400">Teller: {t.tellerId}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-300 italic text-sm">No active transactions.</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-widest">Confirmed Next</h3>
            <div className="flex flex-col items-center py-6 text-center">
              {confirmedNext ? (
                <>
                  <div className="w-24 h-24 bg-green-500 rounded-3xl flex items-center justify-center text-4xl font-black mb-4 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                  {confirmedNext.queueNumber}
                  </div>
                  <p className="text-xl font-bold mb-1">{confirmedNext.name}</p>
                  {confirmedNext.memberId && (
                    <p className="text-sm text-green-300 mb-1">ID: {confirmedNext.memberId}</p>
                  )}
                  <p className="text-green-400 text-sm font-medium">Ready for Teller</p>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 border-4 border-dashed border-slate-700 rounded-3xl flex items-center justify-center text-slate-700 mb-4">
                    <UserCheck size={32} />
                  </div>
                  <p className="text-slate-500 italic">Awaiting confirmation...</p>
                </>
              )}
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Actions</h4>
              <button 
                disabled={!nextUp || !!confirmedNext || inBuildingCount >= maxInBuilding}
                onClick={() => nextUp && updateStatus(nextUp.id, TicketStatus.ELIGIBLE_FOR_ENTRY, 'reception', 'Called by reception')}
                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all disabled:opacity-30"
              >
                Make Eligible for Entry <ArrowRight size={18} />
              </button>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-20" />
        </div>

        <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl">
          <div className="flex gap-3">
            <Info className="text-blue-500 shrink-0" size={20} />
            <p className="text-sm text-blue-700 leading-snug">
              Calling a customer starts their <strong>{branch.gracePeriodMinutes}-minute arrival countdown</strong>. They will be polled at the 1-minute mark.
            </p>
          </div>
        </div>
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
