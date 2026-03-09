import React, { useState } from 'react';
import { BranchConfig, CommsChannel, ServiceCategory } from '../types';
import { MessageCircle, Send, HeartPulse } from 'lucide-react';

interface CustomerJoinProps {
  branches: BranchConfig[];
  onJoin: (
    name: string,
    phone: string,
    channel: CommsChannel,
    branchId: string,
    patientId?: string,
    visitReason?: ServiceCategory,
  ) => void;
}

const VISIT_REASONS: { value: ServiceCategory; label: string }[] = [
  { value: ServiceCategory.GENERAL_CHECKUP, label: 'General Check-up' },
  { value: ServiceCategory.FOLLOW_UP,       label: 'Follow-up Visit' },
  { value: ServiceCategory.CONSULTATION,    label: 'Consultation' },
  { value: ServiceCategory.VACCINATION,     label: 'Vaccination' },
  { value: ServiceCategory.EMERGENCY,       label: 'Emergency / Urgent' },
  { value: ServiceCategory.LAB_RESULTS,     label: 'Lab Results' },
  { value: ServiceCategory.OTHER,           label: 'Other' },
];

const CustomerJoin: React.FC<CustomerJoinProps> = ({ branches, onJoin }) => {
  const [name,                setName]                = useState('');
  const [phone,               setPhone]               = useState('');
  const [consent,             setConsent]             = useState(false);
  const [visitReason,         setVisitReason]         = useState<ServiceCategory | ''>('');
  const [channel,             setChannel]             = useState<CommsChannel>(CommsChannel.SMS);
  const [isSimulatingFailure, setIsSimulatingFailure] = useState(false);

  const selectedBranchId =
    branches.find(b => !b.isPaused)?.id ?? branches[0]?.id ?? '';

  const isValid =
    name.trim().length > 2 &&
    /^\+?[1-9]\d{1,14}$/.test(phone) &&
    consent &&
    !!selectedBranchId;

  const handleJoin = () => {
    const reason = (visitReason || undefined) as ServiceCategory | undefined;
    if (channel === CommsChannel.WHATSAPP && isSimulatingFailure) {
      alert('WhatsApp delivery failed. Switching to SMS fallback…');
      onJoin(name, phone, CommsChannel.SMS, selectedBranchId, undefined, reason);
    } else {
      onJoin(name, phone, channel, selectedBranchId, undefined, reason);
    }
  };

  return (
    <div className="max-w-[420px] mx-auto pt-4 pb-8" data-tour="customer-join">

      {/* ── Wordmark header ──────────────────────────────── */}
      <div className="text-center mb-7">
        <div
          className="inline-flex items-center justify-center h-[52px] w-[52px] rounded-2xl mb-4"
          style={{ background: 'linear-gradient(145deg, #0071E3 0%, #34AADC 100%)' }}
        >
          <HeartPulse size={26} className="text-white" strokeWidth={2} />
        </div>
        <h1 className="text-[22px] font-semibold text-[#1D1D1F] tracking-tight">DocQline Medical</h1>
        <p className="text-[14px] text-[#8E8E93] mt-1">Walk-ins welcome · Open today</p>
      </div>

      {/* ── Form card ────────────────────────────────────── */}
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.05)' }}
      >
        <div className="p-6 space-y-5">

          {/* Full Name */}
          <div>
            <label className="block text-[13px] font-medium text-[#3C3C43] mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full px-3.5 py-[11px] text-[15px] rounded-xl bg-[#F5F5F7] border border-transparent text-[#1D1D1F] placeholder:text-[#AEAEB2] outline-none focus:bg-white focus:border-[#0071E3]/60 focus:ring-2 focus:ring-[#0071E3]/12 transition-all"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-[13px] font-medium text-[#3C3C43] mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 758 456 7890"
              className="w-full px-3.5 py-[11px] text-[15px] rounded-xl bg-[#F5F5F7] border border-transparent text-[#1D1D1F] placeholder:text-[#AEAEB2] outline-none focus:bg-white focus:border-[#0071E3]/60 focus:ring-2 focus:ring-[#0071E3]/12 transition-all"
            />
          </div>

          {/* Visit Reason */}
          <div>
            <label className="block text-[13px] font-medium text-[#3C3C43] mb-1.5">
              Reason for Visit{' '}
              <span className="text-[#AEAEB2] font-normal">— optional</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {VISIT_REASONS.map(({ value, label }) => {
                const active = visitReason === value;
                return (
                  <button
                    key={value}
                    onClick={() => setVisitReason(active ? '' : value)}
                    className={`px-3 py-2 rounded-[10px] text-[13px] font-medium text-left transition-all ${
                      active
                        ? 'text-[#0071E3] bg-[#EBF5FF]'
                        : 'text-[#3C3C43] bg-[#F5F5F7] hover:bg-[#EBEBF0]'
                    }`}
                    style={active ? { border: '1px solid rgba(0,113,227,0.30)' } : { border: '1px solid transparent' }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notification Channel */}
          <div>
            <label className="block text-[13px] font-medium text-[#3C3C43] mb-1.5">
              Notify me via
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setChannel(CommsChannel.SMS)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium border transition-all ${
                  channel === CommsChannel.SMS
                    ? 'bg-[#0071E3] border-[#0071E3] text-white shadow-[0_2px_6px_rgba(0,113,227,0.30)]'
                    : 'bg-[#F5F5F7] border-transparent text-[#6E6E73] hover:bg-[#EBEBF0]'
                }`}
              >
                <Send size={14} strokeWidth={2} /> SMS
              </button>
              <button
                onClick={() => setChannel(CommsChannel.WHATSAPP)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium border transition-all ${
                  channel === CommsChannel.WHATSAPP
                    ? 'bg-[#25D366] border-[#25D366] text-white shadow-[0_2px_6px_rgba(37,211,102,0.30)]'
                    : 'bg-[#F5F5F7] border-transparent text-[#6E6E73] hover:bg-[#EBEBF0]'
                }`}
              >
                <MessageCircle size={14} strokeWidth={2} /> WhatsApp
              </button>
            </div>
          </div>

          {/* Consent */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <div
              className={`mt-[2px] h-5 w-5 flex-shrink-0 rounded-[6px] flex items-center justify-center transition-all ${
                consent
                  ? 'bg-[#0071E3]'
                  : 'bg-[#F5F5F7] border border-[#C7C7CC]'
              }`}
              onClick={() => setConsent(!consent)}
            >
              {consent && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              className="sr-only"
            />
            <span className="text-[13px] text-[#6E6E73] leading-snug">
              I agree to receive queue updates for today's visit.
            </span>
          </label>

          {/* Primary CTA */}
          <button
            disabled={!isValid}
            onClick={handleJoin}
            className={`w-full py-[13px] rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98] ${
              isValid
                ? 'bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-[0_2px_10px_rgba(0,113,227,0.32)]'
                : 'bg-[#E5E5EA] text-[#AEAEB2] cursor-not-allowed'
            }`}
          >
            Join Queue
          </button>

        </div>

        {/* Debug footer (delivery simulation) */}
        <div
          className="px-6 py-3 flex items-center justify-between"
          style={{ background: '#F5F5F7', borderTop: '1px solid rgba(0,0,0,0.05)' }}
        >
          <span className="text-[11px] text-[#AEAEB2]">Simulate delivery failure</span>
          <button
            onClick={() => setIsSimulatingFailure(!isSimulatingFailure)}
            className={`relative w-10 h-[22px] rounded-full transition-colors ${
              isSimulatingFailure ? 'bg-[#FF3B30]' : 'bg-[#D1D1D6]'
            }`}
          >
            <div
              className={`absolute top-[3px] h-4 w-4 bg-white rounded-full shadow-sm transition-all ${
                isSimulatingFailure ? 'left-5' : 'left-[3px]'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerJoin;
