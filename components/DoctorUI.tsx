
import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, ClinicConfig } from '../types';
import { Play, CheckCircle, Clock, User, LogOut } from 'lucide-react';

interface DoctorUIProps {
  tickets: Ticket[];
  updateStatus: (id: string, status: TicketStatus) => void;
  clinic: ClinicConfig;
}

const DoctorUI: React.FC<DoctorUIProps> = ({ tickets, updateStatus, clinic }) => {
  const [timerSeconds, setTimerSeconds] = useState(0);
  const activeConsultation = tickets.find(t => t.status === TicketStatus.IN_CONSULT);
  const nextReady = tickets.find(t => t.status === TicketStatus.ARRIVED);

  useEffect(() => {
    // Fixed: Replaced NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Doctor's Terminal</h2>
          <p className="text-slate-500">Dr. Gravesande | {clinic.service}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-slate-600">Active Session</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Current Patient Card */}
        <div className={`p-8 rounded-[2rem] border-2 transition-all ${activeConsultation ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-white border-dashed border-slate-200 text-slate-300'}`}>
          <div className="flex justify-between items-start mb-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">Current Consultation</p>
              <h3 className="text-3xl font-black mt-2">
                {activeConsultation ? activeConsultation.name : 'No Patient'}
              </h3>
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
                  <p className="font-bold">Ticket #{activeConsultation.queueNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => updateStatus(activeConsultation.id, TicketStatus.SERVED)}
                className="w-full py-5 bg-white text-blue-600 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-lg"
              >
                <CheckCircle size={24} /> CONSULT COMPLETE
              </button>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center opacity-50">
              <Clock size={48} className="mb-4" />
              <p className="font-medium">Please wait for next patient to arrive at reception.</p>
            </div>
          )}
        </div>

        {/* Up Next / Preparation */}
        <div className="space-y-6">
          <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Confirmed Next</h3>
            {nextReady ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl font-black text-slate-800">
                      {nextReady.queueNumber}
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-800">{nextReady.name}</p>
                      <p className="text-sm text-slate-400">Waiting for call</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Present
                  </div>
                </div>

                <button 
                  disabled={!!activeConsultation}
                  onClick={() => updateStatus(nextReady.id, TicketStatus.IN_CONSULT)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-30"
                >
                  <Play size={20} /> CALL TO ENTER ROOM
                </button>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-slate-400 italic">No patients waiting in the "Next Seat".</p>
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <LogOut size={16} /> Session Statistics
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Patients Served</p>
                <p className="text-2xl font-black text-slate-800">
                  {tickets.filter(t => t.status === TicketStatus.SERVED).length}
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Avg Time</p>
                <p className="text-2xl font-black text-slate-800">
                  {clinic.avgConsultTime}m
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorUI;
