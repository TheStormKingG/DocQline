import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, BranchConfig, ServiceCategory } from '../types';
import { CheckCircle, Clock, User, Flag, Stethoscope, Play } from 'lucide-react';

const VISIT_REASON_LABELS: Record<ServiceCategory, string> = {
  [ServiceCategory.GENERAL_CHECKUP]: 'General Check-up',
  [ServiceCategory.FOLLOW_UP]:       'Follow-up Visit',
  [ServiceCategory.CONSULTATION]:    'Consultation',
  [ServiceCategory.VACCINATION]:     'Vaccination',
  [ServiceCategory.EMERGENCY]:       'Emergency / Urgent',
  [ServiceCategory.LAB_RESULTS]:     'Lab Results',
  [ServiceCategory.OTHER]:           'Other',
};

interface TellerUIProps {
  tickets: Ticket[];
  updateStatus: (
    id: string,
    status: TicketStatus,
    triggeredBy?: 'system' | 'reception' | 'teller' | 'customer',
    reason?: string,
  ) => void;
  branch: BranchConfig;
  tellerId?: string;
  onPauseQueue?: () => void;
  onFlagNoShow?: (id: string) => void;
}

const TellerUI: React.FC<TellerUIProps> = ({
  tickets, updateStatus, branch, tellerId, onFlagNoShow,
}) => {
  const [timerSeconds, setTimerSeconds] = useState(0);

  const branchTickets = tickets.filter(t => t.branchId === branch.id);

  const activeConsultation = branchTickets.find(
    t => (t.status === TicketStatus.IN_TRANSACTION || t.status === TicketStatus.IN_SERVICE)
      && t.tellerId === tellerId,
  );
  const nextReady = branchTickets.find(
    t => t.status === TicketStatus.ARRIVED || t.status === TicketStatus.IN_BUILDING,
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeConsultation) {
      interval = setInterval(() => setTimerSeconds(prev => prev + 1), 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeConsultation]);

  const formatTime = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCallNext = () => {
    if (nextReady) {
      updateStatus(nextReady.id, TicketStatus.IN_SERVICE, 'teller', 'Called by doctor/staff');
    }
  };

  const handleComplete = async () => {
    if (activeConsultation) {
      updateStatus(activeConsultation.id, TicketStatus.COMPLETED, 'teller', 'Consultation completed');
    }
  };

  const servedCount = branchTickets.filter(
    t => t.status === TicketStatus.SERVED || t.status === TicketStatus.COMPLETED,
  ).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ── Active consultation card ─────────────────── */}
        <div
          className="rounded-2xl flex flex-col overflow-hidden"
          style={{
            background: activeConsultation
              ? 'linear-gradient(145deg, #0071E3 0%, #34AADC 100%)'
              : '#FFFFFF',
            boxShadow: activeConsultation
              ? '0 8px 30px rgba(0,113,227,0.30)'
              : '0 2px 12px rgba(0,0,0,0.06)',
          }}
          data-tour="teller-current"
        >
          <div className="p-6 flex flex-col flex-1">
            {/* Header row */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: activeConsultation ? 'rgba(255,255,255,0.60)' : '#AEAEB2' }}
                >
                  Current patient
                </p>
                <h3
                  className="text-[24px] font-semibold tracking-tight"
                  style={{ color: activeConsultation ? '#FFFFFF' : '#AEAEB2' }}
                >
                  {activeConsultation ? activeConsultation.name : 'No patient'}
                </h3>
                {activeConsultation?.memberId && (
                  <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    Patient ID: {activeConsultation.memberId}
                  </p>
                )}
              </div>
              {activeConsultation ? (
                <div
                  className="px-3 py-1.5 rounded-xl text-white/90 text-[15px] font-semibold font-mono tabular-nums"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                >
                  {formatTime(timerSeconds)}
                </div>
              ) : (
                <div className="p-3 rounded-xl" style={{ background: '#F5F5F7' }}>
                  <Stethoscope size={22} className="text-[#D1D1D6]" />
                </div>
              )}
            </div>

            {/* Details or empty state */}
            {activeConsultation ? (
              <div className="space-y-3">
                <div
                  className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.12)' }}
                >
                  <User size={18} className="text-white/70" />
                  <div>
                    <p className="text-[11px] text-white/50 mb-0.5">Queue number</p>
                    <p className="text-[14px] font-semibold text-white">
                      Token #{activeConsultation.queueNumber}
                    </p>
                  </div>
                </div>
                {activeConsultation.serviceCategory && (
                  <div
                    className="p-3.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.12)' }}
                  >
                    <p className="text-[11px] text-white/50 mb-0.5">Visit reason</p>
                    <p className="text-[14px] font-semibold text-white">
                      {VISIT_REASON_LABELS[activeConsultation.serviceCategory]
                        ?? activeConsultation.serviceCategory.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                <Stethoscope size={36} className="text-[#D1D1D6] mb-3" />
                <p className="text-[14px] text-[#AEAEB2]">
                  Waiting for the next patient.
                </p>
              </div>
            )}

            {/* Complete + Call Next CTA */}
            <div className="mt-6">
              <button
                disabled={!activeConsultation}
                onClick={async () => {
                  if (activeConsultation) {
                    await handleComplete();
                    if (nextReady) handleCallNext();
                  }
                }}
                className={`w-full py-3.5 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  activeConsultation
                    ? 'bg-white text-[#0071E3] hover:bg-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.12)]'
                    : 'bg-[#F5F5F7] text-[#AEAEB2] cursor-not-allowed'
                }`}
                data-tour="teller-complete"
              >
                <CheckCircle size={18} strokeWidth={2} />
                Complete consultation + call next
              </button>
            </div>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────── */}
        <div className="space-y-4">

          {/* Next patient card */}
          <div
            className="bg-white rounded-2xl p-6"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wider mb-4">
              Next patient
            </p>

            {nextReady ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-[20px] font-bold text-[#1D1D1F] tabular-nums"
                      style={{ background: '#F5F5F7' }}
                    >
                      {nextReady.queueNumber}
                    </div>
                    <div>
                      <p className="text-[16px] font-semibold text-[#1D1D1F] leading-tight">
                        {nextReady.name}
                      </p>
                      {nextReady.memberId && (
                        <p className="text-[12px] text-[#8E8E93]">ID: {nextReady.memberId}</p>
                      )}
                      <p className="text-[12px] text-[#AEAEB2]">In waiting room</p>
                    </div>
                  </div>
                  <span
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                    style={{ background: '#F0FDF4', color: '#16A34A' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                    Present
                  </span>
                </div>

                {nextReady.serviceCategory && (
                  <div className="px-3.5 py-3 bg-[#F5F5F7] rounded-xl">
                    <p className="text-[11px] text-[#AEAEB2] mb-0.5">Visit reason</p>
                    <p className="text-[13px] font-medium text-[#1D1D1F]">
                      {VISIT_REASON_LABELS[nextReady.serviceCategory]
                        ?? nextReady.serviceCategory.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    disabled={!!activeConsultation}
                    onClick={handleCallNext}
                    className={`flex-1 py-3 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                      !activeConsultation
                        ? 'bg-[#1D1D1F] hover:bg-[#2C2C2E] text-white'
                        : 'bg-[#F5F5F7] text-[#AEAEB2] cursor-not-allowed'
                    }`}
                  >
                    <Play size={16} strokeWidth={2.5} /> Call patient in
                  </button>
                  {onFlagNoShow && (
                    <button
                      onClick={() => onFlagNoShow(nextReady.id)}
                      className="px-4 py-3 bg-[#FFF1F0] text-[#FF3B30] rounded-xl font-medium hover:bg-[#FFE4E2] transition-all"
                      title="Flag as no-show"
                    >
                      <Flag size={17} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-[14px] text-[#AEAEB2]">No patients in the waiting room.</p>
              </div>
            )}
          </div>

          {/* Today's stats */}
          <div
            className="bg-white rounded-2xl p-5"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Clock size={13} /> Today's statistics
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="px-4 py-3 bg-[#F5F5F7] rounded-xl">
                <p className="text-[11px] text-[#AEAEB2] font-medium mb-1">Patients seen</p>
                <p className="text-[28px] font-bold text-[#1D1D1F] tabular-nums leading-none">
                  {servedCount}
                </p>
              </div>
              <div className="px-4 py-3 bg-[#F5F5F7] rounded-xl">
                <p className="text-[11px] text-[#AEAEB2] font-medium mb-1">Avg consult.</p>
                <p className="text-[28px] font-bold text-[#1D1D1F] tabular-nums leading-none">
                  {branch.avgTransactionTime}
                  <span className="text-[14px] font-medium text-[#8E8E93] ml-1">min</span>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TellerUI;
