
import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, CommsChannel, ClinicConfig } from './types';
import PatientJoin from './components/PatientJoin';
import PatientStatus from './components/PatientStatus';
import ReceptionDashboard from './components/ReceptionDashboard';
import DoctorUI from './components/DoctorUI';
import { Layout } from './components/Layout';
import { 
  loadTicketsFromSupabase, 
  saveTicketToSupabase, 
  updateTicketInSupabase, 
  saveAllTicketsToSupabase 
} from './supabase';

const CLINIC_PRESET: ClinicConfig = {
  name: "City Health Clinic",
  service: "General Consultation",
  avgConsultTime: 12
};

const App: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);
  const [view, setView] = useState<'patient' | 'receptionist' | 'doctor'>('patient');

  // Load tickets from Supabase (with localStorage fallback)
  useEffect(() => {
    const loadTickets = async () => {
      const loadedTickets = await loadTicketsFromSupabase();
      setTickets(loadedTickets);
    };
    loadTickets();
    
    // Load current patient ID from localStorage
    const patient = localStorage.getItem('doqline_patient_id');
    if (patient) setCurrentPatientId(patient);
  }, []);

  // Save tickets to Supabase when they change
  useEffect(() => {
    if (tickets.length > 0) {
      saveAllTicketsToSupabase(tickets);
    }
    
    // Always save patient ID to localStorage for quick access
    if (currentPatientId) {
      localStorage.setItem('doqline_patient_id', currentPatientId);
    } else {
      localStorage.removeItem('doqline_patient_id');
    }
  }, [tickets, currentPatientId]);

  const addTicket = async (name: string, phone: string, channel: CommsChannel) => {
    const nextNum = tickets.length > 0 ? Math.max(...tickets.map(t => t.queueNumber)) + 1 : 1;
    const newTicket: Ticket = {
      id: Math.random().toString(36).substr(2, 9),
      queueNumber: nextNum,
      name,
      phone,
      channel,
      status: TicketStatus.WAITING,
      joinedAt: Date.now()
    };
    
    // Save to Supabase (with localStorage fallback)
    await saveTicketToSupabase(newTicket);
    
    setTickets(prev => [...prev, newTicket]);
    setCurrentPatientId(newTicket.id);
  };

  const updateTicketStatus = async (id: string, status: TicketStatus) => {
    let updates: Partial<Ticket> = { status };
    if (status === TicketStatus.CALLED) updates.calledAt = Date.now();
    if (status === TicketStatus.IN_CONSULT) updates.consultStartedAt = Date.now();
    if (status === TicketStatus.SERVED) updates.consultEndedAt = Date.now();
    if (status === TicketStatus.NOT_HERE) updates.bumpedAt = Date.now();
    
    // Update in Supabase (with localStorage fallback)
    await updateTicketInSupabase(id, updates);
    
    setTickets(prev => prev.map(t => {
      if (t.id !== id) return t;
      return { ...t, ...updates };
    }));
  };

  const submitFeedback = async (id: string, stars: number) => {
    // Update in Supabase (with localStorage fallback)
    await updateTicketInSupabase(id, { feedbackStars: stars });
    
    setTickets(prev => prev.map(t => t.id === id ? { ...t, feedbackStars: stars } : t));
  };

  const resetAll = () => {
    setTickets([]);
    setCurrentPatientId(null);
    localStorage.clear();
  };

  const currentTicket = tickets.find(t => t.id === currentPatientId);

  return (
    <Layout view={view} setView={setView} resetAll={resetAll}>
      {view === 'patient' && (
        !currentTicket ? (
          <PatientJoin clinic={CLINIC_PRESET} onJoin={addTicket} />
        ) : (
          <PatientStatus 
            ticket={currentTicket} 
            allTickets={tickets} 
            clinic={CLINIC_PRESET} 
            onCancel={() => setCurrentPatientId(null)}
            onSubmitFeedback={submitFeedback}
          />
        )
      )}

      {view === 'receptionist' && (
        <ReceptionDashboard 
          tickets={tickets} 
          updateStatus={updateTicketStatus} 
          clinic={CLINIC_PRESET}
        />
      )}

      {view === 'doctor' && (
        <DoctorUI 
          tickets={tickets} 
          updateStatus={updateTicketStatus}
          clinic={CLINIC_PRESET}
        />
      )}
    </Layout>
  );
};

export default App;
