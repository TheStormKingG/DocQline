import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, BranchConfig, ServiceCategory } from '../types';
import { Play, CheckCircle, Clock, User, Flag, Stethoscope } from 'lucide-react';

const VISIT_REASON_LABELS: Record<ServiceCategory, string> = {
  [ServiceCategory.GENERAL_CHECKUP]: 'General Check-up',
  [ServiceCategory.FOLLOW_UP]: 'Follow-up Visit',
  [ServiceCategory.CONSULTATION]: 'Consultation',
  [ServiceCategory.VACCINATION]: 'Vaccination',
  [ServiceCategory.EMERGENCY]: 'Emergency / Urgent',
  [ServiceCategory.LAB_RESULTS]: 'Lab Results',
  [ServiceCategory.OTHER]: 'Other',
};

interface TellerUIProps {
  tickets: Ticket[];
  updateStatus: (id: string, status: TicketStatus, triggeredBy?: 'system' | 'reception' | 'teller' | 'customer', reason?: string) => void;
  branch: BranchConfig;
  tellerId?: string;
  onPauseQueue?: () => void;
  onFlagNoShow?: (id: string) => void;
}

const TellerUI: React.FC<TellerUIProps> = ({
  tickets,
  updateStatus,
  branch,
  tellerId,
  onPauseQueue,
  onFlagNoShow
}) => {
  const [timerSeconds, setTimerSeconds] = useState(0);

  const branchTickets = tickets.filter(t => t.branchId === branch.id);
  const activeConsultation = branchTickets.find(t =>
    (t.status === TicketStatus.IN_TRANSACTION || t.status === TicketStatus.IN_SERVICE) && t.tellerId === tellerId
  );
  const nextReady = branchTickets.find(t =>
    t.status === TicketStatus.ARRIVED || t.status === TicketStatus.IN_BUILDING
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeConsultation) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeConsultation]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCallNext = () => {
    if (nextReady) {
      updateStatus(nextReady.id, TicketStatus.IN_SERVICE, 'teller', 'Called by doctor/staff');
    }
  };

  const handleCompleteConsultation = () => {
    if (activeConsultation) {
      updateStatus(activeConsultation.id, TicketStatus.COMPLETED, 'teller', 'Consultation completed');
    }
  };

  const servedCount = branchTickets.filter(t =>
    t.status === TicketStatus.SERVED || t.status === TicketStatus.COMPLETED
  ).length;
  const avgTime = branch.avgTransactionTime;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Current Consultation Card */}
        <div
          className={`p-8 rounded-[2rem] border-2 transition-all flex flex-col ${
            activeConsultation ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-white border-dashed border-slate-200 text-slate-300'
          }`}
          data-tour="teller-current"
        >
          <div className="flex justify-between items-start mb-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">Current Patient</p>
              <h3 className="text-3xl font-black mt-2">
                {activeConsultation ? activeConsultation.name : 'No Patient'}
              </h3>
              {activeConsultation?.memberId && (
                <p className="text-sm opacity-80 mt-1">Patient ID: {activeConsultation.memberId}</p>
              )}
            </div>
            {activeConsultation && (
              <div className="px-4 py-2 bg-white/20 rounded-xl backdrop-blur-md">
                <span className="text-xl font-bold font-mono">{formatTime(timerSeconds)}</span>
              </div>
            )}
          </div>

          {activeConsultation ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl border border-white/20">
                <User size={24} />
                <div>
                  <p className="text-sm opacity-70">Queue Number</p>
                  <p className="font-bold">Token #{activeConsultation.queueNumber}</p>
                </div>
              </div>
              {activeConsultation.serviceCategory && (
                <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                  <p className="text-sm opacity-70 mb-1">Visit Reason</p>
                  <p className="font-bold">
                    {VISIT_REASON_LABELS[activeConsultation.serviceCategory] ?? activeConsultation.serviceCategory.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center opacity-50">
              <Stethoscope size={48} className="mb-4" />
              <p className="font-medium">Waiting for the next patient to be called in.</p>
            </div>
          )}

          {/* Complete Consultation + Call Next Button */}
          <div className="mt-auto pt-6">
            <button
              disabled={!activeConsultation}
              onClick={async () => {
                if (activeConsultation) {
                  await handleCompleteConsultation();
                  if (nextReady) {
                    handleCallNext();
                  }
                }
              }}
              className={`w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg ${
                activeConsultation
                  ? 'bg-white text-blue-600 hover:bg-slate-50'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              data-tour="teller-complete"
            >
              <CheckCircle size={24} /> Complete Consultation + Call Next
            </button>
          </div>
        </div>

        {/* Up Next */}
        <div className="space-y-6">
          <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Next Patient</h3>
            {nextReady ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl font-black text-slate-800">
                      {nextReady.queueNumber}
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-800">{nextReady.name}</p>
                      {nextReady.memberId && (
                        <p className="text-xs text-slate-500">ID: {nextReady.memberId}</p>
                      )}
                      <p className="text-sm text-slate-400">Waiting in room</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Present
                  </div>
                </div>

                {nextReady.serviceCategory && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Visit Reason</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {VISIT_REASON_LABELS[nextReady.serviceCategory] ?? nextReady.serviceCategory.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    disabled={!!activeConsultation}
                    onClick={handleCallNext}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-30"
                  >
                    <Play size={20} /> CALL PATIENT IN
                  </button>
                  {onFlagNoShow && (
                    <button
                      onClick={() => onFlagNoShow(nextReady.id)}
                      className="px-4 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all"
                      title="Flag as No-Show"
                    >
                      <Flag size={20} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-slate-400 italic">No patients waiting in the room.</p>
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Clock size={16} /> Today's Statistics
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Patients Seen</p>
                <p className="text-2xl font-black text-slate-800">{servedCount}</p>
              </div>
              <div className="p-3 bg-white rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Avg Consult.</p>
                <p className="text-2xl font-black text-slate-800">{avgTime}m</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TellerUI;
