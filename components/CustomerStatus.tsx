import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, BranchConfig, ServiceCategory } from '../types';
import { Users, Clock, Bell, ChevronLeft, Star, HeartPulse } from 'lucide-react';

const VISIT_REASON_LABELS: Record<ServiceCategory, string> = {
  [ServiceCategory.GENERAL_CHECKUP]: 'General Check-up',
  [ServiceCategory.FOLLOW_UP]:       'Follow-up Visit',
  [ServiceCategory.CONSULTATION]:    'Consultation',
  [ServiceCategory.VACCINATION]:     'Vaccination',
  [ServiceCategory.EMERGENCY]:       'Emergency / Urgent',
  [ServiceCategory.LAB_RESULTS]:     'Lab Results',
  [ServiceCategory.OTHER]:           'Other',
};

interface CustomerStatusProps {
  ticket: Ticket;
  allTickets: Ticket[];
  branch: BranchConfig;
  onCancel: () => void;
  onSubmitFeedback: (id: string, stars: number) => void;
  onConfirmInBuilding?: (id: string) => void;
}

const CustomerStatus: React.FC<CustomerStatusProps> = ({
  ticket, allTickets, branch, onCancel, onSubmitFeedback, onConfirmInBuilding,
}) => {
  const gracePeriodSeconds = branch.gracePeriodMinutes * 60;
  const [timeLeft, setTimeLeft]   = useState(gracePeriodSeconds);
  const [showPoll, setShowPoll]   = useState(false);
  const [feedback, setFeedback]   = useState<number | null>(null);

  const activeTickets = allTickets.filter(t =>
    t.branchId === ticket.branchId &&
    (t.status === TicketStatus.WAITING ||
     t.status === TicketStatus.REMOTE_WAITING ||
     t.status === TicketStatus.CALLED ||
     t.status === TicketStatus.ELIGIBLE_FOR_ENTRY ||
     t.status === TicketStatus.ARRIVED ||
     t.status === TicketStatus.IN_BUILDING),
  );
  const sortedTickets = [...activeTickets].sort((a, b) => a.queueNumber - b.queueNumber);
  const peopleAhead   = sortedTickets.findIndex(t => t.id === ticket.id);
  const eta           = (peopleAhead + 1) * branch.avgTransactionTime;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (ticket.status === TicketStatus.ELIGIBLE_FOR_ENTRY && ticket.eligibleForEntryAt) {
      const elapsed   = Math.floor((Date.now() - ticket.eligibleForEntryAt) / 1000);
      const remaining = gracePeriodSeconds - elapsed;
      if (remaining > 0) {
        setTimeLeft(remaining);
        timer = setInterval(() => {
          setTimeLeft(prev => (prev - 1 <= 0 ? 0 : prev - 1));
        }, 1000);
      } else {
        setTimeLeft(0);
      }
    } else if (ticket.status === TicketStatus.CALLED && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1;
          if (next === branch.gracePeriodMinutes * 60 - 60) setShowPoll(true);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [ticket.status, ticket.eligibleForEntryAt, timeLeft, branch.gracePeriodMinutes, gracePeriodSeconds]);

  const isCalled     = ticket.status === TicketStatus.CALLED || ticket.status === TicketStatus.ELIGIBLE_FOR_ENTRY;
  const isInBuilding = ticket.status === TicketStatus.IN_BUILDING || ticket.status === TicketStatus.ARRIVED;
  const isInService  = ticket.status === TicketStatus.IN_SERVICE  || ticket.status === TicketStatus.IN_TRANSACTION;
  const isCompleted  = ticket.status === TicketStatus.COMPLETED   || ticket.status === TicketStatus.SERVED;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  /* ── Feedback screen ────────────────────────────────────── */
  if (isCompleted && !ticket.feedbackStars) {
    return (
      <div className="max-w-[420px] mx-auto pt-4">
        <div
          className="bg-white rounded-2xl p-8 text-center"
          style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.05)' }}
        >
          <div className="w-14 h-14 bg-[#E8FAF0] rounded-full flex items-center justify-center mx-auto mb-5">
            <Star size={28} className="text-[#34C759]" fill="currentColor" />
          </div>
          <h2 className="text-[20px] font-semibold text-[#1D1D1F] tracking-tight mb-1">
            Consultation complete
          </h2>
          <p className="text-[14px] text-[#8E8E93] mb-7">How was your experience today?</p>
          <div className="flex justify-center gap-1.5 mb-7">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setFeedback(star)}
                className={`p-1 transition-transform hover:scale-110 active:scale-95 ${
                  feedback && feedback >= star ? 'text-[#FF9F0A]' : 'text-[#D1D1D6]'
                }`}
              >
                <Star size={36} fill={feedback && feedback >= star ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          <button
            disabled={!feedback}
            onClick={() => feedback && onSubmitFeedback(ticket.id, feedback)}
            className={`w-full py-3 rounded-xl text-[15px] font-semibold transition-all ${
              feedback
                ? 'bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-[0_2px_8px_rgba(0,113,227,0.28)]'
                : 'bg-[#E5E5EA] text-[#AEAEB2] cursor-not-allowed'
            }`}
          >
            Submit Feedback
          </button>
        </div>
      </div>
    );
  }

  /* ── Status colour scheme ───────────────────────────────── */
  const statusTheme = isCalled
    ? { bg: '#FFF7ED', accent: '#F59E0B', text: '#92400E', badge: '#FEF3C7' }
    : isInBuilding
    ? { bg: '#F0FDF4', accent: '#16A34A', text: '#14532D', badge: '#DCFCE7' }
    : isInService
    ? { bg: '#EFF6FF', accent: '#2563EB', text: '#1E3A8A', badge: '#DBEAFE' }
    : { bg: '#EFF6FF', accent: '#0071E3', text: '#1E3A8A', badge: '#DBEAFE' };

  return (
    <div className="max-w-[420px] mx-auto pt-4 pb-8" data-tour="customer-status">

      {/* Back */}
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 text-[14px] text-[#6E6E73] hover:text-[#1D1D1F] mb-5 transition-colors"
      >
        <ChevronLeft size={18} strokeWidth={2} /> Back
      </button>

      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.05)' }}
      >

        {/* ── Status header ────────────────────────────── */}
        <div className="p-6" style={{ background: statusTheme.bg }}>
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[13px] font-medium" style={{ color: statusTheme.accent }}>
                {ticket.name}
              </p>
              {ticket.memberId && (
                <p className="text-[11px] mt-0.5" style={{ color: statusTheme.accent, opacity: 0.7 }}>
                  Patient ID: {ticket.memberId}
                </p>
              )}
            </div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: statusTheme.badge, color: statusTheme.accent }}
            >
              <HeartPulse size={11} strokeWidth={2.5} />
              {branch.name}
            </div>
          </div>

          {/* Queue number */}
          <div className="mt-3 mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: statusTheme.accent, opacity: 0.6 }}>
              Your number
            </p>
            <span
              className="text-[56px] font-bold leading-none tabular-nums tracking-tight"
              style={{ color: statusTheme.accent }}
            >
              #{ticket.queueNumber}
            </span>
          </div>

          {/* Status block */}
          {isCalled ? (
            <div
              className="rounded-xl p-4"
              style={{ background: statusTheme.badge }}
              data-tour="customer-notification"
            >
              <p className="text-[13px] font-semibold mb-1" style={{ color: statusTheme.text }}>
                {ticket.status === TicketStatus.ELIGIBLE_FOR_ENTRY
                  ? 'You have been called — please check in at reception'
                  : 'Please proceed to the reception desk'}
              </p>
              <p className="text-[32px] font-semibold font-mono leading-none" style={{ color: statusTheme.accent }}>
                {formatTime(timeLeft)}
              </p>
              {ticket.status === TicketStatus.ELIGIBLE_FOR_ENTRY && (
                <p className="text-[12px] mt-1.5" style={{ color: statusTheme.accent, opacity: 0.7 }}>
                  {branch.gracePeriodMinutes} minutes to confirm your arrival
                </p>
              )}
            </div>
          ) : isInBuilding ? (
            <div
              className="rounded-xl p-4"
              style={{ background: statusTheme.badge }}
            >
              <p className="text-[13px] font-semibold" style={{ color: statusTheme.text }}>
                You are in the waiting room
              </p>
              <p className="text-[13px] mt-0.5" style={{ color: statusTheme.accent, opacity: 0.8 }}>
                A doctor or nurse will call you shortly.
              </p>
            </div>
          ) : isInService ? (
            <div
              className="rounded-xl p-4"
              style={{ background: statusTheme.badge }}
            >
              <p className="text-[13px] font-semibold" style={{ color: statusTheme.text }}>
                Consultation in progress
              </p>
              <p className="text-[13px] mt-0.5" style={{ color: statusTheme.accent, opacity: 0.8 }}>
                You are currently with the doctor.
              </p>
            </div>
          ) : (
            <div className="flex gap-3" data-tour="customer-eta">
              <div
                className="flex-1 rounded-xl p-3.5"
                style={{ background: statusTheme.badge }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: statusTheme.accent, opacity: 0.6 }}>
                  Ahead
                </p>
                <div className="flex items-center gap-2">
                  <Users size={15} style={{ color: statusTheme.accent }} />
                  <span className="text-[18px] font-semibold" style={{ color: statusTheme.accent }}>
                    {peopleAhead} {peopleAhead !== 1 ? 'patients' : 'patient'}
                  </span>
                </div>
              </div>
              <div
                className="flex-1 rounded-xl p-3.5"
                style={{ background: statusTheme.badge }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: statusTheme.accent, opacity: 0.6 }}>
                  Est. wait
                </p>
                <div className="flex items-center gap-2">
                  <Clock size={15} style={{ color: statusTheme.accent }} />
                  <span className="text-[18px] font-semibold" style={{ color: statusTheme.accent }}>
                    {eta} min
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Body ─────────────────────────────────────── */}
        <div className="p-6 space-y-5">

          {/* Timeline */}
          <div>
            <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wider mb-3">
              Visit timeline
            </p>
            <div className="space-y-0">
              <TimelineItem
                label="Joined queue"
                sub={new Date(ticket.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                active
                isLast={false}
              />
              <TimelineItem
                label="Called to check in"
                sub={isCalled ? (ticket.status === TicketStatus.ELIGIBLE_FOR_ENTRY ? 'Please proceed to reception' : 'Expiring soon') : ''}
                active={isCalled || isInBuilding || isInService || isCompleted}
                isLast={false}
              />
              <TimelineItem
                label="In waiting room"
                sub=""
                active={isInBuilding || isInService || isCompleted}
                isLast={false}
              />
              <TimelineItem
                label="Consultation started"
                sub=""
                active={isInService || isCompleted}
                isLast
              />
            </div>
          </div>

          {/* Visit reason */}
          {ticket.serviceCategory && (
            <div className="px-4 py-3 bg-[#F5F5F7] rounded-xl">
              <p className="text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wider mb-1">
                Visit reason
              </p>
              <p className="text-[14px] font-medium text-[#1D1D1F]">
                {VISIT_REASON_LABELS[ticket.serviceCategory] ?? ticket.serviceCategory.replace(/_/g, ' ')}
              </p>
            </div>
          )}

          {/* Action button */}
          {ticket.status === TicketStatus.ELIGIBLE_FOR_ENTRY && onConfirmInBuilding ? (
            <button
              onClick={() => onConfirmInBuilding(ticket.id)}
              className="w-full py-3 rounded-xl text-[15px] font-semibold text-white bg-[#34C759] hover:bg-[#28BD4E] shadow-[0_2px_8px_rgba(52,199,89,0.30)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <HeartPulse size={17} strokeWidth={2} /> Confirm arrival at clinic
            </button>
          ) : (
            <button
              className="w-full py-3 rounded-xl text-[15px] font-medium text-[#6E6E73] bg-[#F5F5F7] hover:bg-[#EBEBF0] transition-all flex items-center justify-center gap-2"
            >
              <Bell size={17} strokeWidth={2} /> Notify me when I'm next
            </button>
          )}

        </div>
      </div>

      {/* ── Presence poll modal ──────────────────────────── */}
      {showPoll && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
          <div
            className="w-full max-w-sm rounded-2xl p-7"
            style={{
              background: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.20)',
            }}
          >
            <h3 className="text-[20px] font-semibold text-[#1D1D1F] tracking-tight mb-1.5">
              You're next!
            </h3>
            <p className="text-[14px] text-[#6E6E73] mb-6">
              Are you currently at the clinic?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowPoll(false)}
                className="py-3 rounded-xl text-[14px] font-semibold text-white bg-[#34C759] hover:bg-[#28BD4E] transition-all active:scale-[0.97]"
              >
                Yes, I'm here
              </button>
              <button
                onClick={() => setShowPoll(false)}
                className="py-3 rounded-xl text-[14px] font-semibold text-[#3C3C43] bg-[#F5F5F7] hover:bg-[#EBEBF0] transition-all"
              >
                Not yet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Timeline item ──────────────────────────────────────── */
interface TimelineItemProps {
  label: string;
  sub?: string;
  active: boolean;
  isLast: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ label, sub, active, isLast }) => (
  <div className="flex gap-3">
    {/* Track */}
    <div className="flex flex-col items-center">
      <div
        className={`mt-[3px] h-[10px] w-[10px] rounded-full flex-shrink-0 transition-colors ${
          active ? 'bg-[#0071E3]' : 'bg-[#D1D1D6]'
        }`}
      />
      {!isLast && (
        <div className="w-px flex-1 mt-1 mb-1" style={{ background: active ? '#BFDBFE' : '#E5E5EA', minHeight: '16px' }} />
      )}
    </div>
    {/* Content */}
    <div className="pb-4">
      <p className={`text-[14px] font-medium ${active ? 'text-[#1D1D1F]' : 'text-[#AEAEB2]'}`}>
        {label}
      </p>
      {sub && <p className="text-[12px] text-[#8E8E93] mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default CustomerStatus;
