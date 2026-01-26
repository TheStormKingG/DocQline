
export enum TicketStatus {
  WAITING = 'WAITING',
  CALLED = 'CALLED',    // Triggered countdown (configurable grace period)
  ARRIVED = 'ARRIVED',  // Confirmed presence
  NOT_HERE = 'NOT_HERE', // Grace period after no-show
  IN_TRANSACTION = 'IN_TRANSACTION', // Previously IN_CONSULT
  SERVED = 'SERVED',
  REMOVED = 'REMOVED'
}

export enum CommsChannel {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP'
}

export enum ServiceCategory {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
  LOAN = 'LOAN',
  ACCOUNT_OPENING = 'ACCOUNT_OPENING',
  ACCOUNT_INQUIRY = 'ACCOUNT_INQUIRY',
  OTHER = 'OTHER'
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  MEMBER = 'MEMBER',
  TELLER = 'TELLER',
  RECEPTION = 'RECEPTION',
  MANAGER = 'MANAGER'
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  avgTransactionTime: number; // in minutes, learned over time
  gracePeriodMinutes: number; // configurable grace period
  isActive: boolean;
}

export interface Ticket {
  id: string;
  queueNumber: number;
  name: string;
  phone: string;
  memberId?: string; // Optional member/customer ID
  channel: CommsChannel;
  status: TicketStatus;
  branchId: string;
  serviceCategory?: ServiceCategory;
  counterId?: string; // Which counter/desk is serving
  tellerId?: string; // Which teller is serving
  joinedAt: number;
  calledAt?: number;
  transactionStartedAt?: number; // Previously consultStartedAt
  transactionEndedAt?: number; // Previously consultEndedAt
  bumpedAt?: number;
  feedbackStars?: number;
  auditNotes?: string; // Reception can add notes
  waitTimeMinutes?: number; // Calculated wait time
  isNoShow?: boolean; // Flagged as no-show
}

export interface BranchConfig {
  id: string;
  name: string;
  address: string;
  service: string;
  avgTransactionTime: number; // in minutes
  gracePeriodMinutes: number; // configurable grace period (default 10)
  isPaused: boolean; // Queue can be paused
}

export interface Metrics {
  totalServed: number;
  averageWaitTime: number;
  averageTransactionTime: number;
  noShowCount: number;
  peakHours: { hour: number; count: number }[];
  serviceCategoryBreakdown: { category: ServiceCategory; count: number }[];
}
