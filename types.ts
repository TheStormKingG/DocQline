
export enum TicketStatus {
  WAITING = 'WAITING',
  CALLED = 'CALLED',    // Triggered 10-min countdown
  ARRIVED = 'ARRIVED',  // Confirmed presence
  NOT_HERE = 'NOT_HERE', // Grace period after no-show
  IN_CONSULT = 'IN_CONSULT',
  SERVED = 'SERVED',
  REMOVED = 'REMOVED'
}

export enum CommsChannel {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP'
}

export interface Ticket {
  id: string;
  queueNumber: number;
  name: string;
  phone: string;
  channel: CommsChannel;
  status: TicketStatus;
  joinedAt: number;
  calledAt?: number;
  consultStartedAt?: number;
  consultEndedAt?: number;
  bumpedAt?: number;
  feedbackStars?: number;
}

export interface ClinicConfig {
  name: string;
  service: string;
  avgConsultTime: number; // in minutes
}
