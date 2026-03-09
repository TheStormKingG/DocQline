import React, { useState } from 'react';
import { BranchConfig, CommsChannel, ServiceCategory } from '../types';
import { MessageCircle, Send, CheckCircle2, HeartPulse, Stethoscope } from 'lucide-react';

interface CustomerJoinProps {
  branches: BranchConfig[];
  onJoin: (name: string, phone: string, channel: CommsChannel, branchId: string, patientId?: string, visitReason?: ServiceCategory) => void;
}

const VISIT_REASON_LABELS: Record<ServiceCategory, string> = {
  [ServiceCategory.GENERAL_CHECKUP]: 'General Check-up',
  [ServiceCategory.FOLLOW_UP]: 'Follow-up Visit',
  [ServiceCategory.CONSULTATION]: 'Consultation',
  [ServiceCategory.VACCINATION]: 'Vaccination',
  [ServiceCategory.EMERGENCY]: 'Emergency / Urgent',
  [ServiceCategory.LAB_RESULTS]: 'Lab Results',
  [ServiceCategory.OTHER]: 'Other',
};

const CustomerJoin: React.FC<CustomerJoinProps> = ({ branches, onJoin }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [isSimulatingFailure, setIsSimulatingFailure] = useState(false);
  const [visitReason, setVisitReason] = useState<ServiceCategory | ''>('');

  // Use first active (non-paused) branch as default
  const selectedBranchId = branches.find(b => !b.isPaused)?.id || branches[0]?.id || '';
  const isValid = name.trim().length > 2 && /^\+?[1-9]\d{1,14}$/.test(phone) && consent && selectedBranchId;

  const handleJoin = (channel: CommsChannel) => {
    const reason = visitReason || undefined;
    if (channel === CommsChannel.WHATSAPP && isSimulatingFailure) {
      alert('WhatsApp delivery failed. Switching to SMS fallback...');
      onJoin(name, phone, CommsChannel.SMS, selectedBranchId, undefined, reason as ServiceCategory | undefined);
    } else {
      onJoin(name, phone, channel, selectedBranchId, undefined, reason as ServiceCategory | undefined);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100" data-tour="customer-join">
      {/* Hero Banner */}
      <div className="relative p-8 text-white overflow-hidden" style={{ minHeight: '220px' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-teal-600" />
        {/* Subtle medical pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 10h8v6h6v8h-6v6h-8v-6h-6v-8h6z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }} />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30">
            <HeartPulse size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold leading-tight drop-shadow-lg">DocQline Medical Centre</h2>
          <p className="text-blue-100 text-sm mt-1 drop-shadow-md">Patient Queue System</p>
          <div className="mt-4 flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs border border-white/30 shadow-lg">
            <CheckCircle2 size={13} className="text-emerald-300" />
            <span>Walk-ins Welcome · Open Today</span>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Johnson"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 758 456 7890"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Reason for Visit <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.values(ServiceCategory) as ServiceCategory[]).map(reason => (
              <button
                key={reason}
                onClick={() => setVisitReason(visitReason === reason ? '' : reason)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all text-left flex items-center gap-1.5 ${
                  visitReason === reason
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Stethoscope size={11} className="flex-shrink-0" />
                {VISIT_REASON_LABELS[reason]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="consent" className="text-sm text-slate-600 leading-tight">
            I agree to receive queue updates by SMS or WhatsApp for today's visit.
          </label>
        </div>

        {isValid && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button
              onClick={() => handleJoin(CommsChannel.SMS)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50 transition-all group"
            >
              <Send className="text-slate-400 group-hover:text-blue-600" size={24} />
              <span className="text-sm font-bold text-slate-700">Join via SMS</span>
            </button>
            <button
              onClick={() => handleJoin(CommsChannel.WHATSAPP)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-100 hover:border-green-600 hover:bg-green-50 transition-all group"
            >
              <MessageCircle className="text-slate-400 group-hover:text-green-600" size={24} />
              <span className="text-sm font-bold text-slate-700">Join via WhatsApp</span>
            </button>
          </div>
        )}

        <div className="pt-4 border-t flex items-center justify-between">
          <span className="text-xs text-slate-400">Simulate WhatsApp Fail?</span>
          <button
            onClick={() => setIsSimulatingFailure(!isSimulatingFailure)}
            className={`w-10 h-5 rounded-full transition-colors relative ${isSimulatingFailure ? 'bg-red-500' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all ${isSimulatingFailure ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerJoin;
