import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './config';
import { Ticket } from './types';

// Initialize Supabase client
export const supabase: SupabaseClient | null = SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey
  ? createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
  : null;

// Log connection status
if (supabase) {
  console.log('✓ Supabase connected:', SUPABASE_CONFIG.url);
} else {
  console.warn('⚠ Supabase not configured. App will use localStorage fallback.');
}

// Helper functions to transform between database format (snake_case) and app format (camelCase)
function ticketToDbFormat(ticket: Ticket): any {
  return {
    id: ticket.id,
    queue_number: ticket.queueNumber,
    name: ticket.name,
    phone: ticket.phone,
    member_id: ticket.memberId,
    channel: ticket.channel,
    status: ticket.status,
    branch_id: ticket.branchId,
    service_category: ticket.serviceCategory,
    counter_id: ticket.counterId,
    teller_id: ticket.tellerId,
    joined_at: ticket.joinedAt,
    called_at: ticket.calledAt,
    transaction_started_at: ticket.transactionStartedAt,
    transaction_ended_at: ticket.transactionEndedAt,
    bumped_at: ticket.bumpedAt,
    feedback_stars: ticket.feedbackStars,
    audit_notes: ticket.auditNotes,
    wait_time_minutes: ticket.waitTimeMinutes,
    is_no_show: ticket.isNoShow,
  };
}

function ticketFromDbFormat(dbTicket: any): Ticket {
  return {
    id: dbTicket.id,
    queueNumber: dbTicket.queue_number ?? dbTicket.queueNumber,
    name: dbTicket.name,
    phone: dbTicket.phone,
    memberId: dbTicket.member_id ?? dbTicket.memberId,
    channel: dbTicket.channel,
    status: dbTicket.status,
    branchId: dbTicket.branch_id ?? dbTicket.branchId,
    serviceCategory: dbTicket.service_category ?? dbTicket.serviceCategory,
    counterId: dbTicket.counter_id ?? dbTicket.counterId,
    tellerId: dbTicket.teller_id ?? dbTicket.tellerId,
    joinedAt: dbTicket.joined_at ?? dbTicket.joinedAt,
    calledAt: dbTicket.called_at ?? dbTicket.calledAt,
    transactionStartedAt: dbTicket.transaction_started_at ?? dbTicket.transactionStartedAt,
    transactionEndedAt: dbTicket.transaction_ended_at ?? dbTicket.transactionEndedAt,
    bumpedAt: dbTicket.bumped_at ?? dbTicket.bumpedAt,
    feedbackStars: dbTicket.feedback_stars ?? dbTicket.feedbackStars,
    auditNotes: dbTicket.audit_notes ?? dbTicket.auditNotes,
    waitTimeMinutes: dbTicket.wait_time_minutes ?? dbTicket.waitTimeMinutes,
    isNoShow: dbTicket.is_no_show ?? dbTicket.isNoShow,
  };
}

// Helper functions for CRUD operations

/**
 * Save a ticket to Supabase (with localStorage fallback)
 */
export async function saveTicketToSupabase(ticket: Ticket): Promise<Ticket | null> {
  if (!supabase) {
    // Fallback to localStorage
    const existing = JSON.parse(localStorage.getItem('doqline_tickets') || '[]');
    const updated = [...existing, ticket];
    localStorage.setItem('doqline_tickets', JSON.stringify(updated));
    return ticket;
  }

  try {
    const dbTicket = ticketToDbFormat(ticket);
    const { data, error } = await supabase
      .from('tickets')
      .insert([dbTicket])
      .select()
      .single();

    if (error) throw error;
    console.log('✓ Saved ticket to Supabase:', data);
    return ticketFromDbFormat(data);
  } catch (error) {
    console.error('✗ Supabase error:', error);
    // Fallback to localStorage
    const existing = JSON.parse(localStorage.getItem('doqline_tickets') || '[]');
    const updated = [...existing, ticket];
    localStorage.setItem('doqline_tickets', JSON.stringify(updated));
    return ticket;
  }
}

/**
 * Load all tickets from Supabase (with localStorage fallback)
 */
export async function loadTicketsFromSupabase(): Promise<Ticket[]> {
  if (!supabase) {
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem('doqline_tickets') || '[]');
  }

  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(ticketFromDbFormat);
  } catch (error) {
    console.error('✗ Supabase error:', error);
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem('doqline_tickets') || '[]');
  }
}

/**
 * Update a ticket in Supabase (with localStorage fallback)
 */
export async function updateTicketInSupabase(id: string, updates: Partial<Ticket>): Promise<Ticket | null> {
  if (!supabase) {
    // Fallback to localStorage
    const existing = JSON.parse(localStorage.getItem('doqline_tickets') || '[]');
    const updated = existing.map((ticket: Ticket) =>
      ticket.id === id ? { ...ticket, ...updates } : ticket
    );
    localStorage.setItem('doqline_tickets', JSON.stringify(updated));
    return updated.find((t: Ticket) => t.id === id) || null;
  }

  try {
    // Transform updates to database format
    const dbUpdates: any = {};
    if (updates.queueNumber !== undefined) dbUpdates.queue_number = updates.queueNumber;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.memberId !== undefined) dbUpdates.member_id = updates.memberId;
    if (updates.channel !== undefined) dbUpdates.channel = updates.channel;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.branchId !== undefined) dbUpdates.branch_id = updates.branchId;
    if (updates.serviceCategory !== undefined) dbUpdates.service_category = updates.serviceCategory;
    if (updates.counterId !== undefined) dbUpdates.counter_id = updates.counterId;
    if (updates.tellerId !== undefined) dbUpdates.teller_id = updates.tellerId;
    if (updates.joinedAt !== undefined) dbUpdates.joined_at = updates.joinedAt;
    if (updates.calledAt !== undefined) dbUpdates.called_at = updates.calledAt;
    if (updates.transactionStartedAt !== undefined) dbUpdates.transaction_started_at = updates.transactionStartedAt;
    if (updates.transactionEndedAt !== undefined) dbUpdates.transaction_ended_at = updates.transactionEndedAt;
    if (updates.bumpedAt !== undefined) dbUpdates.bumped_at = updates.bumpedAt;
    if (updates.feedbackStars !== undefined) dbUpdates.feedback_stars = updates.feedbackStars;
    if (updates.auditNotes !== undefined) dbUpdates.audit_notes = updates.auditNotes;
    if (updates.waitTimeMinutes !== undefined) dbUpdates.wait_time_minutes = updates.waitTimeMinutes;
    if (updates.isNoShow !== undefined) dbUpdates.is_no_show = updates.isNoShow;

    const { data, error } = await supabase
      .from('tickets')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return ticketFromDbFormat(data);
  } catch (error) {
    console.error('✗ Supabase error:', error);
    // Fallback to localStorage
    const existing = JSON.parse(localStorage.getItem('doqline_tickets') || '[]');
    const updated = existing.map((ticket: Ticket) =>
      ticket.id === id ? { ...ticket, ...updates } : ticket
    );
    localStorage.setItem('doqline_tickets', JSON.stringify(updated));
    return updated.find((t: Ticket) => t.id === id) || null;
  }
}

/**
 * Delete a ticket from Supabase (with localStorage fallback)
 */
export async function deleteTicketFromSupabase(id: string): Promise<void> {
  if (!supabase) {
    // Fallback to localStorage
    const existing = JSON.parse(localStorage.getItem('doqline_tickets') || '[]');
    const filtered = existing.filter((ticket: Ticket) => ticket.id !== id);
    localStorage.setItem('doqline_tickets', JSON.stringify(filtered));
    return;
  }

  try {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) throw error;
    console.log('✓ Deleted ticket from Supabase');
  } catch (error) {
    console.error('✗ Supabase error:', error);
    // Fallback to localStorage
    const existing = JSON.parse(localStorage.getItem('doqline_tickets') || '[]');
    const filtered = existing.filter((ticket: Ticket) => ticket.id !== id);
    localStorage.setItem('doqline_tickets', JSON.stringify(filtered));
  }
}

/**
 * Save all tickets to Supabase (for bulk operations)
 */
export async function saveAllTicketsToSupabase(tickets: Ticket[]): Promise<void> {
  if (!supabase) {
    localStorage.setItem('doqline_tickets', JSON.stringify(tickets));
    return;
  }

  try {
    // Clear existing tickets and insert all
    const { error: deleteError } = await supabase
      .from('tickets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError && deleteError.code !== 'PGRST116') throw deleteError; // Ignore "no rows" error

    if (tickets.length > 0) {
      const dbTickets = tickets.map(ticketToDbFormat);
      const { error: insertError } = await supabase
        .from('tickets')
        .insert(dbTickets);

      if (insertError) throw insertError;
    }

    console.log('✓ Saved all tickets to Supabase');
  } catch (error) {
    console.error('✗ Supabase error:', error);
    // Fallback to localStorage
    localStorage.setItem('doqline_tickets', JSON.stringify(tickets));
  }
}
