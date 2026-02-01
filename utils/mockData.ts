import { Ticket, TicketStatus, CommsChannel, ServiceCategory } from '../types';

/**
 * Generate mock tickets for testing analytics dashboard
 * Creates tickets spread across multiple days, weeks, months, quarters, and hours
 */
export const generateMockTickets = (branchId: string, count: number = 500): Ticket[] => {
  const tickets: Ticket[] = [];
  const now = Date.now();
  const daysBack = 90; // Generate data for last 90 days (3 months)
  const startTime = now - (daysBack * 24 * 60 * 60 * 1000);

  const names = [
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

  const serviceCategories = Object.values(ServiceCategory);
  const channels = Object.values(CommsChannel);
  const statuses = [TicketStatus.COMPLETED, TicketStatus.SERVED, TicketStatus.IN_SERVICE];

  // Create patterns for peak hours (9-11 AM and 2-4 PM on weekdays)
  const getPeakHour = (date: Date): number => {
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    
    // Weekdays (Monday-Friday)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Morning peak: 9-11 AM
      if (hour >= 9 && hour <= 11) {
        return 9 + Math.floor(Math.random() * 3); // 9, 10, or 11
      }
      // Afternoon peak: 2-4 PM
      if (hour >= 14 && hour <= 16) {
        return 14 + Math.floor(Math.random() * 3); // 14, 15, or 16
      }
    }
    
    // Random hour for off-peak times
    return Math.floor(Math.random() * 24);
  };

  // Create more tickets on weekdays, fewer on weekends
  const getDayMultiplier = (date: Date): number => {
    const dayOfWeek = date.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) return 1.5; // Weekdays
    return 0.5; // Weekends
  };

  // Create more tickets in certain months (e.g., January, March, June)
  const getMonthMultiplier = (month: number): number => {
    if (month === 0 || month === 2 || month === 5) return 1.3; // Jan, Mar, Jun
    return 1.0;
  };

  let queueNumber = 1;
  
  for (let i = 0; i < count; i++) {
    // Generate timestamp with weighted distribution
    const randomDays = Math.random() * daysBack;
    const baseDate = new Date(startTime + randomDays * 24 * 60 * 60 * 1000);
    
    // Adjust for day of week and month patterns
    const dayMultiplier = getDayMultiplier(baseDate);
    const monthMultiplier = getMonthMultiplier(baseDate.getMonth());
    const shouldCreate = Math.random() < (dayMultiplier * monthMultiplier / 2);
    
    if (!shouldCreate && i > count * 0.1) continue; // Skip some to create patterns
    
    // Set hour based on peak patterns
    const hour = getPeakHour(baseDate);
    baseDate.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
    
    const joinedAt = baseDate.getTime();
    const name = names[Math.floor(Math.random() * names.length)];
    const phone = phones[Math.floor(Math.random() * phones.length)];
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const serviceCategory = serviceCategories[Math.floor(Math.random() * serviceCategories.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Calculate transaction times (5-15 minutes)
    const transactionDuration = 5 + Math.floor(Math.random() * 10);
    const transactionStartedAt = joinedAt + (10 + Math.floor(Math.random() * 20)) * 60 * 1000; // 10-30 min wait
    const transactionEndedAt = transactionStartedAt + transactionDuration * 60 * 1000;
    
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
      memberId: `MEM${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    };
    
    tickets.push(ticket);
  }
  
  // Sort by joinedAt to ensure proper queue numbers
  tickets.sort((a, b) => a.joinedAt - b.joinedAt);
  
  // Reassign queue numbers sequentially
  tickets.forEach((ticket, index) => {
    ticket.queueNumber = index + 1;
  });
  
  return tickets;
};
