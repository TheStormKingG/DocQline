
import React from 'react';
import { Ticket, TicketStatus, ClinicConfig } from '../types';
import { UserCheck, UserX, ArrowRight, Info } from 'lucide-react';

interface ReceptionDashboardProps {
  tickets: Ticket[];
  updateStatus: (id: string, status: TicketStatus) => void;
  clinic: ClinicConfig;
}

const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({ tickets, updateStatus, clinic }) => {
  const waiting = tickets.filter(t => t.status === TicketStatus.WAITING).sort((a, b) => a.queueNumber - b.queueNumber);
  const called = tickets.filter(t => t.status === TicketStatus.CALLED).sort((a, b) => a.queueNumber - b.queueNumber);
  const inConsult = tickets.filter(t => t.status === TicketStatus.IN_CONSULT);
  
  const confirmedNext = tickets.find(t => t.status === TicketStatus.ARRIVED);
  const nextUp = waiting[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      {/* Queue Grid */}
      <div className="lg:col-span-8 space-y-8">
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            Queue Overview <span className="text-sm font-normal text-slate-400">({waiting.length + called.length} Active)</span>
          </h2>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {tickets.filter(t => t.status !== TicketStatus.SERVED && t.status !== TicketStatus.REMOVED).map(ticket => (
              <div 
                key={ticket.id}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
                  ticket.status === TicketStatus.CALLED ? 'bg-orange-50 border-orange-200 text-orange-600' :
                  ticket.status === TicketStatus.IN_CONSULT ? 'bg-blue-600 border-blue-600 text-white' :
                  ticket.status === TicketStatus.ARRIVED ? 'bg-green-600 border-green-600 text-white animate-pulse' :
                  'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className="text-xl font-black">{ticket.queueNumber}</span>
                <span className="text-[10px] uppercase font-bold tracking-tighter opacity-70">
                  {ticket.status === TicketStatus.ARRIVED ? 'Next' : 
                   ticket.status === TicketStatus.IN_CONSULT ? 'In' : 
                   ticket.status === TicketStatus.CALLED ? 'Called' : 'Waiting'}
                </span>
              </div>
            ))}
            {/* Empty slots representation */}
            {Array.from({ length: Math.max(0, 16 - tickets.length) }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                <span className="text-slate-200 text-xl font-black">{tickets.length + i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
                        <p className="text-xs text-slate-400">Called {new Date(t.calledAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateStatus(t.id, TicketStatus.ARRIVED)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                        title="Mark Arrived"
                      >
                        <UserCheck size={18} />
                      </button>
                      <button 
                        onClick={() => updateStatus(t.id, TicketStatus.NOT_HERE)}
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
              <p className="text-slate-300 italic text-sm">No patients currently in "Called" state.</p>
            )}
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-widest">In Consultation</h3>
            {inConsult.length > 0 ? (
              <ul className="space-y-4">
                {inConsult.map(t => (
                  <li key={t.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
                      {t.queueNumber}
                    </div>
                    <div>
                      <p className="font-bold text-blue-900">{t.name}</p>
                      <p className="text-xs text-blue-400">Dr. Gravesande</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-300 italic text-sm">No active consultations.</p>
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
                  <p className="text-green-400 text-sm font-medium">Ready for Doctor</p>
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
                disabled={!nextUp || !!confirmedNext}
                onClick={() => nextUp && updateStatus(nextUp.id, TicketStatus.CALLED)}
                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all disabled:opacity-30"
              >
                Call Next Patient <ArrowRight size={18} />
              </button>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-20" />
        </div>

        <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl">
          <div className="flex gap-3">
            <Info className="text-blue-500 shrink-0" size={20} />
            <p className="text-sm text-blue-700 leading-snug">
              Calling a patient starts their <strong>10-minute arrival countdown</strong>. They will be polled at the 1-minute mark.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionDashboard;
