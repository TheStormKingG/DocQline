import React, { useState } from 'react';
import { BranchConfig, CommsChannel, ServiceCategory } from '../types';
import { MessageCircle, Send, CheckCircle2, Building2, CreditCard } from 'lucide-react';

interface CustomerJoinProps {
  branches: BranchConfig[];
  onJoin: (name: string, phone: string, channel: CommsChannel, branchId: string, memberId?: string, serviceCategory?: ServiceCategory) => void;
}

const CustomerJoin: React.FC<CustomerJoinProps> = ({ branches, onJoin }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [memberId, setMemberId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || '');
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory | undefined>(undefined);
  const [consent, setConsent] = useState(false);
  const [isSimulatingFailure, setIsSimulatingFailure] = useState(false);

  const selectedBranch = branches.find(b => b.id === selectedBranchId);
  const isValid = name.trim().length > 2 && /^\+?[1-9]\d{1,14}$/.test(phone) && consent && selectedBranchId;

  const handleJoin = (channel: CommsChannel) => {
    if (channel === CommsChannel.WHATSAPP && isSimulatingFailure) {
      alert("WhatsApp delivery failed. Switching to SMS fallback...");
      onJoin(name, phone, CommsChannel.SMS, selectedBranchId, memberId || undefined, serviceCategory);
    } else {
      onJoin(name, phone, channel, selectedBranchId, memberId || undefined, serviceCategory);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
      <div className="bg-gradient-to-br from-blue-700 to-blue-800 p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <img 
              src="/logo1.png" 
              alt="Laborie Co-operative Credit Union" 
              className="h-12 w-12 object-contain"
            />
            <div>
              <h2 className="text-2xl font-bold leading-tight">Laborie Co-operative</h2>
              <p className="text-blue-100 text-sm">Credit Union</p>
            </div>
          </div>
          <p className="text-blue-100 text-sm mb-2">Service Queue System</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-yellow-400/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs border border-yellow-400/30">
            <CheckCircle2 size={14} className="text-yellow-300" /> Est. 1976 • Member-Owned
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Your Name</label>
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Johnson"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number (E.164)</label>
          <input 
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 0123"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Member/Customer ID <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input 
            type="text"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            placeholder="e.g. MEM-12345"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Select Branch</label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          >
            {branches.filter(b => b.isActive).map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name} - {branch.address}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Service Category <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <select
            value={serviceCategory || ''}
            onChange={(e) => setServiceCategory(e.target.value ? e.target.value as ServiceCategory : undefined)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          >
            <option value="">Select a service...</option>
            <option value={ServiceCategory.DEPOSIT}>Deposit</option>
            <option value={ServiceCategory.WITHDRAWAL}>Withdrawal</option>
            <option value={ServiceCategory.TRANSFER}>Transfer</option>
            <option value={ServiceCategory.LOAN}>Loan Services</option>
            <option value={ServiceCategory.ACCOUNT_OPENING}>Account Opening</option>
            <option value={ServiceCategory.ACCOUNT_INQUIRY}>Account Inquiry</option>
            <option value={ServiceCategory.OTHER}>Other</option>
          </select>
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
