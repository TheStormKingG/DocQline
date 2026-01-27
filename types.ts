
export enum TicketStatus {
  REMOTE_WAITING = 'REMOTE_WAITING', // Waiting remotely (not in building)
  ELIGIBLE_FOR_ENTRY = 'ELIGIBLE_FOR_ENTRY', // Can enter building now
  IN_BUILDING = 'IN_BUILDING', // Currently inside the building
  WAITING = 'WAITING', // Legacy - maps to REMOTE_WAITING
  CALLED = 'CALLED',    // Triggered countdown (configurable grace period) - maps to ELIGIBLE_FOR_ENTRY
  ARRIVED = 'ARRIVED',  // Confirmed presence - maps to IN_BUILDING
  NOT_HERE = 'NOT_HERE', // Grace period after no-show
  IN_TRANSACTION = 'IN_TRANSACTION', // Previously IN_CONSULT - now IN_SERVICE
  IN_SERVICE = 'IN_SERVICE', // Currently being served (in transaction)
  SERVED = 'SERVED', // Transaction completed
  COMPLETED = 'COMPLETED', // Alias for SERVED
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
  eligibleForEntryAt?: number; // When customer became eligible to enter
  enteredBuildingAt?: number; // When customer entered the building
  leftBuildingAt?: number; // When customer left the building
  transactionStartedAt?: number; // Previously consultStartedAt
  transactionEndedAt?: number; // Previously consultEndedAt
  bumpedAt?: number;
  feedbackStars?: number;
  auditNotes?: string; // Reception can add notes
  statusHistory?: StatusTransition[]; // Audit log of all status transitions
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
  maxInBuilding: number; // Maximum customers allowed in building (default 9)
  excludeInServiceFromCapacity: boolean; // Whether to exclude IN_SERVICE from capacity count (default false)
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
