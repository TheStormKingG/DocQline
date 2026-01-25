
import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, ClinicConfig } from '../types';
import { Users, Clock, Bell, ChevronLeft, Star } from 'lucide-react';

interface PatientStatusProps {
  ticket: Ticket;
  allTickets: Ticket[];
  clinic: ClinicConfig;
  onCancel: () => void;
  onSubmitFeedback: (id: string, stars: number) => void;
}

const PatientStatus: React.FC<PatientStatusProps> = ({ ticket, allTickets, clinic, onCancel, onSubmitFeedback }) => {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [showPoll, setShowPoll] = useState(false);
  const [feedback, setFeedback] = useState<number | null>(null);

  const activeTickets = allTickets.filter(t => t.status === TicketStatus.WAITING || t.status === TicketStatus.CALLED || t.status === TicketStatus.ARRIVED);
  const sortedTickets = [...activeTickets].sort((a, b) => a.queueNumber - b.queueNumber);
  const peopleAhead = sortedTickets.findIndex(t => t.id === ticket.id);
  const eta = (peopleAhead + 1) * clinic.avgConsultTime;

  // Handle countdown if status is CALLED
  useEffect(() => {
    // Fixed: Replaced NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility
    let timer: ReturnType<typeof setInterval>;
    if (ticket.status === TicketStatus.CALLED && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1;
          // Trigger poll at 1 minute (60 seconds)
          if (next === 60) setShowPoll(true);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [ticket.status, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (ticket.status === TicketStatus.SERVED && !ticket.feedbackStars) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Star size={32} fill="currentColor" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Visit Complete!</h2>
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
        <div className={`p-8 text-white ${ticket.status === TicketStatus.CALLED ? 'bg-orange-500' : 'bg-blue-600'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 font-medium">Hello, {ticket.name}</p>
              <h2 className="text-4xl font-black mt-1">#{ticket.queueNumber}</h2>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
              <Bell size={24} />
            </div>
          </div>
          
          {ticket.status === TicketStatus.CALLED ? (
            <div className="mt-6 bg-white/10 rounded-xl p-4 border border-white/20">
              <p className="text-sm font-bold">PLEASE ARRIVE AT RECEPTION</p>
              <p className="text-3xl font-mono mt-1">{formatTime(timeLeft)}</p>
            </div>
          ) : (
            <div className="mt-6 flex gap-4">
              <div className="flex-1 bg-white/10 rounded-xl p-3 border border-white/20">
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">Ahead</p>
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span className="text-xl font-bold">{peopleAhead} Patients</span>
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
              <TimelineItem label="Called to Reception" active={ticket.status !== TicketStatus.WAITING} sub={ticket.status === TicketStatus.CALLED ? 'Expiring soon' : ''} />
              <TimelineItem label="Entered Consultation" active={ticket.status === TicketStatus.IN_CONSULT || ticket.status === TicketStatus.SERVED} />
            </div>
          </div>

          <button className="w-full py-4 border-2 border-slate-100 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            <Bell size={18} /> Notify me when I'm next
          </button>
        </div>
      </div>

      {showPoll && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 mb-2">Next Seat Poll</h3>
            <p className="text-slate-600 mb-6">Are you currently present at the reception "Next Seat"?</p>
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

export default PatientStatus;
