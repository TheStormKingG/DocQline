
export enum TicketStatus {
  REMOTE_WAITING = 'REMOTE_WAITING',          // Patient hasn't arrived yet (pre-arrival queue)
  ELIGIBLE_FOR_ENTRY = 'ELIGIBLE_FOR_ENTRY',  // Patient called to check in at reception
  IN_BUILDING = 'IN_BUILDING',                // Patient is in the waiting room
  WAITING = 'WAITING',                        // Legacy alias for REMOTE_WAITING
  CALLED = 'CALLED',                          // Legacy alias for ELIGIBLE_FOR_ENTRY
  ARRIVED = 'ARRIVED',                        // Legacy alias for IN_BUILDING
  NOT_HERE = 'NOT_HERE',                      // Grace period expired / no-show
  IN_TRANSACTION = 'IN_TRANSACTION',          // Legacy alias for IN_SERVICE
  IN_SERVICE = 'IN_SERVICE',                  // Patient is currently with doctor/staff
  SERVED = 'SERVED',                          // Consultation completed
  COMPLETED = 'COMPLETED',                    // Alias for SERVED
  REMOVED = 'REMOVED'
}

export enum CommsChannel {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP'
}

export enum ServiceCategory {
  GENERAL_CHECKUP = 'GENERAL_CHECKUP',
  FOLLOW_UP = 'FOLLOW_UP',
  CONSULTATION = 'CONSULTATION',
  VACCINATION = 'VACCINATION',
  EMERGENCY = 'EMERGENCY',
  LAB_RESULTS = 'LAB_RESULTS',
  OTHER = 'OTHER'
}

export enum UserRole {
  PATIENT = 'PATIENT',
  RECEPTIONIST = 'RECEPTIONIST',
  NURSE = 'NURSE',
  DOCTOR = 'DOCTOR',
  MANAGER = 'MANAGER',
  // Legacy aliases kept for backward compatibility
  CUSTOMER = 'PATIENT',
  MEMBER = 'PATIENT',
  TELLER = 'DOCTOR',
  RECEPTION = 'RECEPTIONIST'
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  avgTransactionTime: number; // avg consultation time in minutes
  gracePeriodMinutes: number; // grace period for patient check-in confirmation
  isActive: boolean;
}

export interface Ticket {
  id: string;
  queueNumber: number;
  name: string;
  phone: string;
  memberId?: string;            // Patient / chart ID
  channel: CommsChannel;
  status: TicketStatus;
  branchId: string;
  serviceCategory?: ServiceCategory;
  counterId?: string;           // Which consultation room / station
  tellerId?: string;            // Which doctor / staff member is serving
  joinedAt: number;
  calledAt?: number;
  eligibleForEntryAt?: number;  // When patient was called to check in
  enteredBuildingAt?: number;   // When patient entered the waiting room
  leftBuildingAt?: number;      // When patient left the waiting room
  transactionStartedAt?: number; // When consultation started
  transactionEndedAt?: number;   // When consultation ended
  bumpedAt?: number;
  feedbackStars?: number;
  auditNotes?: string;          // Reception / triage notes
  statusHistory?: StatusTransition[];
  waitTimeMinutes?: number;     // Calculated wait time before consultation
  isNoShow?: boolean;
}

export interface BranchConfig {
  id: string;
  name: string;
  address: string;
  service: string;
  avgTransactionTime: number;     // avg consultation duration in minutes
  gracePeriodMinutes: number;     // minutes patient has to confirm arrival (default 10)
  isPaused: boolean;
  maxInBuilding: number;          // max patients allowed in waiting room
  excludeInServiceFromCapacity: boolean;
}

export interface StatusTransition {
  ticketId: string;
  fromStatus: TicketStatus;
  toStatus: TicketStatus;
  timestamp: number;
  triggeredBy: 'system' | 'reception' | 'teller' | 'customer';
  reason?: string;
}

export interface Metrics {
  totalServed: number;
  averageWaitTime: number;
  averageTransactionTime: number;
  noShowCount: number;
  peakHours: { hour: number; count: number }[];
  serviceCategoryBreakdown: { category: ServiceCategory; count: number }[];
}
