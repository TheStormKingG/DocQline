import React, { useState } from 'react';
import { Ticket, TicketStatus, BranchConfig } from '../types';
import { UserCheck, FileText, Stethoscope } from 'lucide-react';

interface ReceptionDashboardProps {
  tickets: Ticket[];
  updateStatus: (
    id: string,
    status: TicketStatus,
    triggeredBy?: 'system' | 'reception' | 'teller' | 'customer',
    reason?: string,
  ) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  branch: BranchConfig;
  inBuildingCount: number;
  maxInBuilding: number;
}

const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
  tickets, updateStatus, updateTicket, branch, inBuildingCount, maxInBuilding,
}) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [auditNote, setAuditNote]           = useState('');

  const branchTickets = tickets.filter(t => t.branchId === branch.id);

  const remoteWaiting = branchTickets
    .filter(t => t.status === TicketStatus.REMOTE_WAITING || t.status === TicketStatus.WAITING)
    .sort((a, b) => a.queueNumber - b.queueNumber);

  const inBuilding = branchTickets
    .filter(t => t.status === TicketStatus.IN_BUILDING || t.status === TicketStatus.ARRIVED)
    .sort((a, b) => a.queueNumber - b.queueNumber);

  const inService = branchTickets.filter(
    t => t.status === TicketStatus.IN_SERVICE || t.status === TicketStatus.IN_TRANSACTION,
  );

  const handleMarkEntered = async (ticketId: string) => {
    if (inBuildingCount >= maxInBuilding) {
      alert(`Waiting room at capacity (${inBuildingCount}/${maxInBuilding}). Cannot check patient in.`);
      return;
    }
    await updateStatus(ticketId, TicketStatus.IN_BUILDING, 'reception', 'Checked in by reception');
  };

  const handleMarkLeft = async (ticketId: string) => {
    await updateStatus(ticketId, TicketStatus.REMOTE_WAITING, 'reception', 'Marked as left by reception');
  };

  const handleAddAuditNote = () => {
    if (selectedTicket && auditNote.trim()) {
      const existing = selectedTicket.auditNotes || '';
      const updated  = existing
        ? `${existing}\n[${new Date().toLocaleString()}] ${auditNote}`
        : `[${new Date().toLocaleString()}] ${auditNote}`;
      updateTicket(selectedTicket.id, { auditNotes: updated });
      setAuditNote('');
      setSelectedTicket(null);
    }
  };

  /* ── Helpers ── */
  const capacityPct   = maxInBuilding > 0 ? inBuildingCount / maxInBuilding : 0;
  const capacityColor = capacityPct >= 1 ? '#FF3B30' : capacityPct >= 0.8 ? '#FF9F0A' : '#34C759';

  return (
    <div className="flex flex-col gap-2 h-full overflow-hidden" data-tour="reception-dashboard">

      {/* ── Top row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 flex-shrink-0">

        {/* Waiting Room Grid */}
        <div
          className="lg:col-span-8 bg-white rounded-xl p-3 flex-shrink-0"
          style={{
            height: 'calc((100vh - 200px) * 0.30)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
          data-tour="capacity-gate"
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-2" style={{ height: '20px' }}>
            <span className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wider">
              Waiting Room
            </span>
            {/* Capacity pill */}
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums"
              style={{ background: `${capacityColor}18`, color: capacityColor }}
            >
              {inBuildingCount} / {maxInBuilding}
            </span>
          </div>

          <div
            className="grid gap-1.5"
            style={{
              gridTemplateColumns: 'repeat(5, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              height: 'calc(100% - 22px)',
              width: '100%',
            }}
          >
            {Array.from({ length: 10 }).map((_, index) => {
              const spotNumber      = index + 1;
              const patientInSpot   = inBuilding[index];
              const isOverCapacity  = spotNumber > maxInBuilding;

              return (
                <div
                  key={index}
                  onClick={() => patientInSpot && setSelectedTicket(patientInSpot)}
                  className={`rounded-[10px] flex flex-col items-center justify-center transition-all ${
                    patientInSpot
                      ? 'cursor-pointer hover:opacity-90'
                      : 'border border-dashed'
                  }`}
                  style={{
                    width: '100%', height: '100%', minHeight: 0,
                    ...(patientInSpot
                      ? { background: '#F0FDF4', border: '1px solid #86EFAC' }
                      : { borderColor: '#E5E5EA', background: '#FAFAFA' }),
                    ...(isOverCapacity ? { opacity: 0.35 } : {}),
                  }}
                >
                  {patientInSpot ? (
                    <>
                      <span className="text-[15px] font-bold text-[#16A34A] tabular-nums leading-none">
                        {patientInSpot.queueNumber}
                      </span>
                      <span className="text-[10px] font-semibold text-[#16A34A]/80 mt-0.5 leading-none truncate px-1 max-w-full">
                        {patientInSpot.name.split(' ')[0].substring(0, 8)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[13px] font-semibold text-[#D1D1D6]">
                        {spotNumber}
                      </span>
                      <span className="text-[9px] font-medium text-[#D1D1D6] mt-0.5 leading-none">
                        {spotNumber === 1 ? 'next' : ''}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* In Consultation panel */}
        <div
          className="lg:col-span-4 rounded-xl relative overflow-hidden flex-shrink-0 p-3 flex flex-col glass-dark"
          style={{ height: 'calc((100vh - 200px) * 0.30)' }}
        >
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2 flex-shrink-0">
            In Consultation
          </p>
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            {inService.length > 0 ? (
              <>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-[18px] font-bold text-white mb-2 tabular-nums"
                  style={{ background: '#34C759', boxShadow: '0 0 18px rgba(52,199,89,0.40)' }}
                >
                  {inService[0].queueNumber}
                </div>
                <p className="text-[13px] font-semibold text-white leading-tight">
                  {inService[0].name}
                </p>
                {inService[0].memberId && (
                  <p className="text-[10px] text-white/40 mt-0.5">ID: {inService[0].memberId}</p>
                )}
                {inService[0].tellerId && (
                  <p className="text-[10px] text-[#34C759]/80 mt-0.5">Dr: {inService[0].tellerId}</p>
                )}
              </>
            ) : (
              <>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-2"
                  style={{ border: '1.5px dashed rgba(255,255,255,0.15)' }}>
                  <Stethoscope size={18} className="text-white/25" />
                </div>
                <p className="text-[11px] text-white/30 italic">No active consultation</p>
              </>
            )}
          </div>
          {/* Ambient glow */}
          <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full blur-[40px]"
            style={{ background: '#0071E3', opacity: 0.15 }} />
        </div>

      </div>

      {/* ── Pre-Arrival Queue ─────────────────────────────── */}
      <div
        className="bg-white rounded-xl p-3 flex-1 flex flex-col min-h-0"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <span className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wider">
            Pre-Arrival
          </span>
          {remoteWaiting.length > 0 && (
            <span className="text-[11px] font-semibold text-[#8E8E93]">
              {remoteWaiting.length} waiting
            </span>
          )}
        </div>

        <div
          className="grid gap-[3px] flex-1 min-h-0 overflow-y-auto"
          style={{ gridTemplateColumns: 'repeat(10, 1fr)', gridTemplateRows: 'repeat(5, 1fr)' }}
        >
          {Array.from({ length: 50 }).map((_, index) => {
            const spotNumber = index + 11;
            const ticket     = remoteWaiting[index];

            if (!ticket) {
              return (
                <div
                  key={`empty-${index}`}
                  className="rounded-[6px] flex flex-col items-center justify-center border border-dashed"
                  style={{ borderColor: '#E5E5EA', background: '#FAFAFA', width: '100%', height: '100%', minHeight: 0 }}
                >
                  <span className="text-[9px] font-medium text-[#D1D1D6]">#{spotNumber}</span>
                </div>
              );
            }
            return (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="rounded-[6px] flex flex-col items-center justify-center cursor-pointer transition-all hover:opacity-80"
                style={{
                  background: '#F5F5F7',
                  border: '1px solid #E5E5EA',
                  width: '100%', height: '100%', minHeight: 0,
                }}
              >
                <span className="text-[10px] font-bold text-[#3C3C43] tabular-nums">{ticket.queueNumber}</span>
                <span className="text-[8px] font-medium text-[#AEAEB2] mt-0.5 leading-none truncate px-0.5 max-w-full">
                  {ticket.name.split(' ')[0].substring(0, 7)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Audit / Triage Modal ──────────────────────────── */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            }}
          >
            <h3 className="text-[18px] font-semibold text-[#1D1D1F] tracking-tight mb-0.5">
              Triage note
            </h3>
            <p className="text-[13px] text-[#8E8E93] mb-4">
              Token #{selectedTicket.queueNumber} — {selectedTicket.name}
            </p>

            {selectedTicket.auditNotes && (
              <div className="mb-4 p-3.5 bg-[#F5F5F7] rounded-xl max-h-32 overflow-y-auto">
                <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wider mb-1.5">
                  Existing notes
                </p>
                <p className="text-[13px] text-[#3C3C43] whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.auditNotes}
                </p>
              </div>
            )}

            <textarea
              value={auditNote}
              onChange={e => setAuditNote(e.target.value)}
              placeholder="Enter triage note, observation, or exception…"
              className="w-full px-3.5 py-3 text-[14px] rounded-xl bg-[#F5F5F7] border border-transparent text-[#1D1D1F] placeholder:text-[#AEAEB2] outline-none focus:bg-white focus:border-[#0071E3]/60 focus:ring-2 focus:ring-[#0071E3]/12 transition-all mb-4 resize-none"
              rows={4}
            />

            <div className="flex gap-2.5">
              <button
                onClick={handleAddAuditNote}
                disabled={!auditNote.trim()}
                className={`flex-1 py-2.5 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all ${
                  auditNote.trim()
                    ? 'bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-[0_2px_6px_rgba(0,113,227,0.25)]'
                    : 'bg-[#E5E5EA] text-[#AEAEB2] cursor-not-allowed'
                }`}
              >
                <FileText size={15} /> Save note
              </button>
              <button
                onClick={() => { setSelectedTicket(null); setAuditNote(''); }}
                className="px-5 py-2.5 rounded-xl text-[14px] font-medium text-[#6E6E73] bg-[#F5F5F7] hover:bg-[#EBEBF0] transition-all"
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
