import { Ticket, TicketStatus, CommsChannel, ServiceCategory } from '../types';

/**
 * Generate mock patient visit tickets for analytics testing.
 * Creates realistic data spread across multiple days, weeks, months, quarters, and hours
 * with clinic-appropriate patterns (morning and afternoon peaks on weekdays).
 */
export const generateMockTickets = (branchId: string, count: number = 500): Ticket[] => {
  const tickets: Ticket[] = [];
  const now = Date.now();
  const daysBack = 90;
  const startTime = now - (daysBack * 24 * 60 * 60 * 1000);

  const patientNames = [
    'John Smith', 'Mary Johnson', 'David Williams', 'Sarah Brown', 'Michael Jones',
    'Emily Davis', 'James Wilson', 'Jessica Martinez', 'Robert Taylor', 'Amanda Anderson',
    'William Thomas', 'Ashley Jackson', 'Christopher White', 'Stephanie Harris', 'Daniel Martin',
    'Nicole Thompson', 'Matthew Garcia', 'Michelle Martinez', 'Andrew Robinson', 'Lauren Clark',
    'Joshua Rodriguez', 'Samantha Lewis', 'Ryan Lee', 'Brittany Walker', 'Kevin Hall',
    'Rachel Allen', 'Brandon Young', 'Megan King', 'Justin Wright', 'Kayla Lopez'
  ];

  const phones = [
    '758-456-7890', '758-456-7891', '758-456-7892', '758-456-7893', '758-456-7894',
    '758-456-7895', '758-456-7896', '758-456-7897', '758-456-7898', '758-456-7899'
  ];

  const visitReasons = Object.values(ServiceCategory);
  const channels = Object.values(CommsChannel);
  const statuses = [TicketStatus.COMPLETED, TicketStatus.SERVED, TicketStatus.IN_SERVICE];

  // Clinic peak hours: 9–11 AM and 2–4 PM on weekdays
  const getPeakHour = (date: Date): number => {
    const dayOfWeek = date.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      if (Math.random() < 0.4) return 9 + Math.floor(Math.random() * 3);  // 9–11 AM
      if (Math.random() < 0.4) return 14 + Math.floor(Math.random() * 3); // 2–4 PM
    }
    return 8 + Math.floor(Math.random() * 9); // Random 8 AM – 4 PM
  };

  const getDayMultiplier = (date: Date): number => {
    const dayOfWeek = date.getDay();
    return (dayOfWeek >= 1 && dayOfWeek <= 5) ? 1.5 : 0.5;
  };

  const getMonthMultiplier = (month: number): number => {
    if (month === 0 || month === 2 || month === 5) return 1.3; // Jan, Mar, Jun
    return 1.0;
  };

  let queueNumber = 1;

  for (let i = 0; i < count; i++) {
    const randomDays = Math.random() * daysBack;
    const baseDate = new Date(startTime + randomDays * 24 * 60 * 60 * 1000);

    const dayMultiplier = getDayMultiplier(baseDate);
    const monthMultiplier = getMonthMultiplier(baseDate.getMonth());
    const shouldCreate = Math.random() < (dayMultiplier * monthMultiplier / 2);

    if (!shouldCreate && i > count * 0.1) continue;

    const hour = getPeakHour(baseDate);
    baseDate.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

    const joinedAt = baseDate.getTime();
    const name = patientNames[Math.floor(Math.random() * patientNames.length)];
    const phone = phones[Math.floor(Math.random() * phones.length)];
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const serviceCategory = visitReasons[Math.floor(Math.random() * visitReasons.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    // Consultation durations: 10–25 minutes
    const consultDuration = 10 + Math.floor(Math.random() * 15);
    // Wait time before consultation: 10–40 minutes
    const transactionStartedAt = joinedAt + (10 + Math.floor(Math.random() * 30)) * 60 * 1000;
    const transactionEndedAt = transactionStartedAt + consultDuration * 60 * 1000;

    // ~5% of patients are no-shows
    const isNoShow = Math.random() < 0.05;

    const ticket: Ticket = {
      id: `mock-${i}-${Date.now()}`,
      queueNumber: queueNumber++,
      name,
      phone,
      channel,
      status,
      branchId,
      serviceCategory,
      joinedAt,
      transactionStartedAt,
      transactionEndedAt,
      waitTimeMinutes: Math.floor((transactionStartedAt - joinedAt) / 60000),
      memberId: `PT${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      isNoShow,
    };

    tickets.push(ticket);
  }

  tickets.sort((a, b) => a.joinedAt - b.joinedAt);
  tickets.forEach((ticket, index) => {
    ticket.queueNumber = index + 1;
  });

  return tickets;
};
