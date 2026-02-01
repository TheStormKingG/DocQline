import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, BranchConfig } from '../types';
import { Users, Clock, Bell, ChevronLeft, Star, Building2 } from 'lucide-react';

interface CustomerStatusProps {
  ticket: Ticket;
  allTickets: Ticket[];
  branch: BranchConfig;
  onCancel: () => void;
  onSubmitFeedback: (id: string, stars: number) => void;
  onConfirmInBuilding?: (id: string) => void;
}

const CustomerStatus: React.FC<CustomerStatusProps> = ({ ticket, allTickets, branch, onCancel, onSubmitFeedback, onConfirmInBuilding }) => {
  const gracePeriodSeconds = branch.gracePeriodMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(gracePeriodSeconds);
  const [showPoll, setShowPoll] = useState(false);
  const [feedback, setFeedback] = useState<number | null>(null);

  // Filter tickets for same branch and active status
  const activeTickets = allTickets.filter(t => 
    t.branchId === ticket.branchId && 
    (t.status === TicketStatus.WAITING || t.status === TicketStatus.REMOTE_WAITING ||
     t.status === TicketStatus.CALLED || t.status === TicketStatus.ELIGIBLE_FOR_ENTRY ||
     t.status === TicketStatus.ARRIVED || t.status === TicketStatus.IN_BUILDING)
  );
  const sortedTickets = [...activeTickets].sort((a, b) => a.queueNumber - b.queueNumber);
  const peopleAhead = sortedTickets.findIndex(t => t.id === ticket.id);
  const eta = (peopleAhead + 1) * branch.avgTransactionTime;

  // Handle countdown if status is ELIGIBLE_FOR_ENTRY (10 minute grace period)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (ticket.status === TicketStatus.ELIGIBLE_FOR_ENTRY && ticket.eligibleForEntryAt) {
      const elapsed = Math.floor((Date.now() - ticket.eligibleForEntryAt) / 1000);
      const remaining = gracePeriodSeconds - elapsed;
      if (remaining > 0) {
        setTimeLeft(remaining);
        timer = setInterval(() => {
          setTimeLeft(prev => {
            const next = prev - 1;
            if (next <= 0) {
              // Grace period expired - will be handled by App.tsx checkGracePeriodExpiry
              return 0;
            }
            return next;
          });
        }, 1000);
      } else {
        setTimeLeft(0);
      }
    } else if (ticket.status === TicketStatus.CALLED && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1;
          const oneMinuteBefore = branch.gracePeriodMinutes * 60 - 60;
          if (next === oneMinuteBefore) setShowPoll(true);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [ticket.status, ticket.eligibleForEntryAt, timeLeft, branch.gracePeriodMinutes, gracePeriodSeconds]);

  // Determine if customer is called/eligible
  const isCalled = ticket.status === TicketStatus.CALLED || ticket.status === TicketStatus.ELIGIBLE_FOR_ENTRY;
  const isInBuilding = ticket.status === TicketStatus.IN_BUILDING || ticket.status === TicketStatus.ARRIVED;
  const isInService = ticket.status === TicketStatus.IN_SERVICE || ticket.status === TicketStatus.IN_TRANSACTION;
  const isCompleted = ticket.status === TicketStatus.COMPLETED || ticket.status === TicketStatus.SERVED;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isCompleted && !ticket.feedbackStars) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Star size={32} fill="currentColor" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Transaction Complete!</h2>
        <p className="text-slate-600 mb-8">How was your wait-time satisfaction today?</p>
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map(star => (
            <button 
              key={star} 
              onClick={() => setFeedback(star)}
              className={`p-2 transition-transform hover:scale-110 ${feedback && feedback >= star ? 'text-yellow-400' : 'text-slate-200'}`}
            >
              <Star size={40} fill={feedback && feedback >= star ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
        <button 
          disabled={!feedback}
          onClick={() => feedback && onSubmitFeedback(ticket.id, feedback)}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50"
        >
          Submit Feedback
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <button 
        onClick={onCancel}
        className="flex items-center gap-2 text-slate-500 mb-6 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft size={20} /> Back to Home
      </button>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className={`p-8 text-white ${isCalled ? 'bg-orange-500' : isInBuilding ? 'bg-green-600' : 'bg-blue-600'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 font-medium">Hello, {ticket.name}</p>
              {ticket.memberId && (
                <p className="text-blue-200 text-xs mt-1">Member ID: {ticket.memberId}</p>
              )}
              <h2 className="text-4xl font-black mt-1">#{ticket.queueNumber}</h2>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
              <Bell size={24} />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-blue-100 text-sm">
            <Building2 size={14} />
            <span>{branch.name}</span>
          </div>
          
          {isCalled ? (
            <div className="mt-6 bg-white/10 rounded-xl p-4 border border-white/20">
              <p className="text-sm font-bold">
                {ticket.status === TicketStatus.ELIGIBLE_FOR_ENTRY ? 'YOU ARE NOW #10 - YOU MAY ENTER' : 'PLEASE ARRIVE AT COUNTER'}
              </p>
              {ticket.status === TicketStatus.ELIGIBLE_FOR_ENTRY ? (
                <>
                  <p className="text-lg mt-1">You have 10 minutes to confirm entry</p>
                  <p className="text-3xl font-mono mt-2">{formatTime(timeLeft)}</p>
                </>
              ) : (
                <p className="text-3xl font-mono mt-1">{formatTime(timeLeft)}</p>
              )}
            </div>
          ) : isInBuilding ? (
            <div className="mt-6 bg-white/10 rounded-xl p-4 border border-white/20">
              <p className="text-sm font-bold">YOU ARE INSIDE</p>
              <p className="text-lg mt-1">Waiting for teller</p>
            </div>
          ) : (
            <div className="mt-6 flex gap-4">
              <div className="flex-1 bg-white/10 rounded-xl p-3 border border-white/20">
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">Ahead</p>
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span className="text-xl font-bold">{peopleAhead} Customers</span>
                </div>
              </div>
              <div className="flex-1 bg-white/10 rounded-xl p-3 border border-white/20">
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">Est. Wait</p>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span className="text-xl font-bold">{eta} mins</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800">Queue Timeline</h3>
            <div className="space-y-2">
              <TimelineItem label="Joined Queue" active={true} sub={new Date(ticket.joinedAt).toLocaleTimeString()} />
              <TimelineItem label="Eligible for Entry" active={isCalled || isInBuilding} sub={isCalled ? (ticket.status === TicketStatus.ELIGIBLE_FOR_ENTRY ? 'You may enter' : 'Expiring soon') : ''} />
              <TimelineItem label="In Building" active={isInBuilding || isInService} />
              <TimelineItem label="Transaction Started" active={isInService || isCompleted} />
            </div>
          </div>

          {ticket.serviceCategory && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Service Category</p>
              <p className="text-sm font-semibold text-slate-800">{ticket.serviceCategory.replace('_', ' ')}</p>
            </div>
          )}

          {ticket.status === TicketStatus.ELIGIBLE_FOR_ENTRY && onConfirmInBuilding ? (
            <button 
              onClick={() => onConfirmInBuilding(ticket.id)}
              className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
            >
              <Building2 size={18} /> Confirm In-Building Status
            </button>
          ) : (
            <button className="w-full py-4 border-2 border-slate-100 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <Bell size={18} /> Notify me when I'm next
            </button>
          )}
        </div>
      </div>

      {showPoll && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 mb-2">You're Next!</h3>
            <p className="text-slate-600 mb-6">Are you currently present at the counter?</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowPoll(false)}
                className="py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all"
              >
                YES, I'M HERE
              </button>
              <button 
                onClick={() => setShowPoll(false)}
                className="py-4 bg-slate-100 text-slate-800 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                NOT YET
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TimelineItem = ({ label, active, sub }: { label: string, active: boolean, sub?: string }) => (
  <div className="flex items-start gap-4">
    <div className={`mt-1.5 w-3 h-3 rounded-full ${active ? 'bg-blue-600' : 'bg-slate-200'}`} />
    <div>
      <p className={`text-sm font-semibold ${active ? 'text-slate-800' : 'text-slate-400'}`}>{label}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  </div>
);

export default CustomerStatus;
