import React, { useState } from 'react';
import { Ticket, TicketStatus, BranchConfig } from '../types';
import { UserCheck, FileText } from 'lucide-react';

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

  const branchTickets = tickets.filter(t => t.branchId === branch.id);

  const remoteWaiting = branchTickets.filter(t =>
    t.status === TicketStatus.REMOTE_WAITING || t.status === TicketStatus.WAITING
  ).sort((a, b) => a.queueNumber - b.queueNumber);

  const inBuilding = branchTickets.filter(t =>
    t.status === TicketStatus.IN_BUILDING || t.status === TicketStatus.ARRIVED
  ).sort((a, b) => a.queueNumber - b.queueNumber);

  const inService = branchTickets.filter(t =>
    t.status === TicketStatus.IN_SERVICE || t.status === TicketStatus.IN_TRANSACTION
  );

  const handleMarkEntered = async (ticketId: string) => {
    if (inBuildingCount >= maxInBuilding) {
      alert(`⚠️ Waiting room at capacity (${inBuildingCount}/${maxInBuilding}). Cannot check patient in.`);
      return;
    }
    await updateStatus(ticketId, TicketStatus.IN_BUILDING, 'reception', 'Checked in by reception');
  };

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
      {/* Top Row: Waiting Room + In Consultation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 flex-shrink-0">

        {/* Waiting Room Capacity Grid */}
        <div
          className="lg:col-span-8 bg-white rounded-lg shadow-sm border border-slate-100 flex-shrink-0 p-2"
          style={{ height: 'calc((100vh - 200px) * 0.30)' }}
          data-tour="capacity-gate"
        >
          <div className="flex items-center justify-between mb-2 h-5">
            <h3 className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">
              Waiting Room ({inBuildingCount}/{maxInBuilding})
            </h3>
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
              const patientInSpot = sortedInBuilding[index];
              const isEmpty = spotNumber > maxInBuilding;

              return (
                <div
                  key={index}
                  onClick={() => patientInSpot && setSelectedTicket(patientInSpot)}
                  className={`rounded-md flex flex-col items-center justify-center border-2 transition-all ${
                    patientInSpot
                      ? 'bg-green-50 border-green-300 cursor-pointer hover:border-green-400'
                      : 'border-dashed border-slate-200 bg-slate-50'
                  }`}
                  style={{ width: '100%', height: '100%', minHeight: 0 }}
                >
                  {patientInSpot ? (
                    <>
                      <span className="text-lg font-black text-green-700">{patientInSpot.queueNumber}</span>
                      <span className="text-[10px] uppercase font-bold tracking-tighter text-green-600 mt-1 leading-none">
                        {patientInSpot.name.split(' ')[0].substring(0, 6)}
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

        {/* In Consultation Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-1.5">
          <div
            className="bg-slate-900 text-white rounded-xl relative overflow-hidden flex-shrink-0 p-3"
            style={{ height: 'calc((100vh - 200px) * 0.30)' }}
          >
            <div className="relative z-10 h-full flex flex-col">
              <h3 className="text-slate-400 text-[9px] font-bold uppercase mb-2 tracking-widest flex-shrink-0">
                In Consultation
              </h3>
              <div className="flex flex-col items-center justify-center flex-1 text-center">
                {inService.length > 0 ? (
                  <>
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-xl font-black mb-1 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                      {inService[0].queueNumber}
                    </div>
                    <p className="text-xs font-bold mb-0.5">{inService[0].name}</p>
                    {inService[0].memberId && (
                      <p className="text-[9px] text-green-300 mb-0.5">ID: {inService[0].memberId}</p>
                    )}
                    {inService[0].tellerId && (
                      <p className="text-[9px] text-green-300 mb-0.5">Dr: {inService[0].tellerId}</p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-700 mb-1">
                      <UserCheck size={16} />
                    </div>
                    <p className="text-slate-500 italic text-[9px]">No active consultation</p>
                  </>
                )}
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-600 rounded-full blur-[40px] opacity-20" />
          </div>
        </div>
      </div>

      {/* Pre-Arrival Queue — Full Width Below */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 flex-1 flex flex-col min-h-0 p-2" style={{ minHeight: 0, width: '100%' }}>
        <h3 className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1.5 flex-shrink-0">
          Pre-Arrival ({remoteWaiting.length})
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
              const spotNumber = index + 11;
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
              const spotNumber = index + 11;
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

      {/* Triage / Audit Notes Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 mb-2">Triage / Audit Note</h3>
            <p className="text-slate-600 mb-4">
              Token #{selectedTicket.queueNumber} — {selectedTicket.name}
            </p>

            {selectedTicket.auditNotes && (
              <div className="mb-4 p-4 bg-slate-50 rounded-xl max-h-40 overflow-y-auto">
                <p className="text-xs text-slate-500 font-bold mb-2">Existing Notes:</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedTicket.auditNotes}</p>
              </div>
            )}

            <textarea
              value={auditNote}
              onChange={(e) => setAuditNote(e.target.value)}
              placeholder="Enter triage note, observation, or exception details..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all mb-4"
              rows={4}
            />

            <div className="flex gap-3">
              <button
                onClick={handleAddAuditNote}
                disabled={!auditNote.trim()}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FileText size={18} /> Save Note
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
