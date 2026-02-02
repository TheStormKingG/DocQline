import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { TicketStatus, CommsChannel } from '../types';

interface TourStep {
  target: string; // CSS selector or data attribute
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  view?: 'customer' | 'receptionist' | 'teller' | 'manager'; // Required view for this step
  action?: (trackAction: (action: { type: string; data: any; undo: () => Promise<void> }) => void) => Promise<void> | void; // Action to perform before showing this step
  waitForAction?: boolean; // Whether to wait for action to complete
  undoAction?: () => Promise<void> | void; // Action to undo this step
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="customer-join"]',
    title: 'Join the Queue',
    content: 'Enter your name and phone number. You will get a ticket number when you join.',
    placement: 'bottom',
    view: 'customer'
  },
  {
    target: '[data-tour="customer-eta"]',
    title: 'Your Position',
    content: 'See how many people are ahead of you. See how long you will wait.',
    placement: 'bottom',
    view: 'customer'
  },
  {
    target: '[data-tour="customer-notification"]',
    title: 'Notifications',
    content: 'When you move to #10, you get a message. You have 10 minutes to enter or you go back in line.',
    placement: 'bottom',
    view: 'customer'
  },
  {
    target: '[data-tour="reception-dashboard"]',
    title: 'Reception View',
    content: 'Watch the queue move. See who is inside the building and who is waiting outside.',
    placement: 'bottom',
    view: 'receptionist'
  },
  {
    target: '[data-tour="capacity-gate"]',
    title: 'Building Capacity',
    content: 'Only 10 people can be inside. When space opens, customer #11 gets a message to enter.',
    placement: 'bottom',
    view: 'receptionist'
  },
  {
    target: '[data-tour="teller-current"]',
    title: 'Current Customer',
    content: 'See the customer you are helping now. See their name and ticket number.',
    placement: 'bottom',
    view: 'teller'
  },
  {
    target: '[data-tour="teller-complete"]',
    title: 'Complete Service',
    content: 'Click this button when done. It will finish this customer and call the next one.',
    placement: 'top',
    view: 'teller'
  }
];

interface ProductTourProps {
  currentView: 'customer' | 'receptionist' | 'teller' | 'manager';
  currentCustomerId?: string | null;
  onSetView?: (view: 'customer' | 'receptionist' | 'teller' | 'manager') => void;
  onAddTicket?: (name: string, phone: string, channel: any, branchId: string, memberId?: string, serviceCategory?: any) => void;
  onUpdateStatus?: (id: string, status: any, triggeredBy?: 'system' | 'reception' | 'teller' | 'customer', reason?: string) => void;
  onSetCurrentCustomer?: (id: string | null) => void;
  onRemoveTicket?: (id: string) => void;
  tickets?: any[];
  branchId?: string;
}

const ProductTour: React.FC<ProductTourProps> = ({ 
  currentView,
  currentCustomerId,
  onSetView, 
  onAddTicket, 
  onUpdateStatus, 
  onSetCurrentCustomer,
  onRemoveTicket,
  tickets = [],
  branchId = 'vieux-fort-branch'
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [tourCustomerId, setTourCustomerId] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  // Track actions performed in each step for undo
  const stepActionsRef = useRef<Map<number, { type: string; data: any; undo: () => Promise<void> }[]>>(new Map());

  // Check if tour should be shown on first load
  useEffect(() => {
    const tourPreference = localStorage.getItem('tour_preference');
    if (tourPreference === null) {
      // First time - show welcome modal
      setShowWelcomeModal(true);
    }
  }, []);

  // Track when tour customer ticket is created
  useEffect(() => {
    if (isRunning && !tourCustomerId && tickets.length > 0 && onSetCurrentCustomer) {
      const tourTicket = tickets.find(t => t.name === 'Tour Customer' && t.phone === '+17581234567');
      if (tourTicket) {
        setTourCustomerId(tourTicket.id);
        onSetCurrentCustomer(tourTicket.id);
      }
    }
  }, [tickets, isRunning, tourCustomerId, onSetCurrentCustomer]);

  // Don't filter steps - tour will switch views as needed
  // Create dynamic steps that execute actions
  // Use useMemo to recreate steps when tickets change
  const filteredSteps = React.useMemo(() => {
    const steps: TourStep[] = [];
    let stepIndex = 0;

    // Step 1: Customer Join
    steps.push({
      target: '[data-tour="customer-join"]',
      title: 'Join the Queue',
      content: 'Enter your name and phone number. You will get a ticket number when you join.',
      placement: 'bottom',
      view: 'customer',
      action: async (trackAction) => {
        // Ensure we're in customer view and no customer is selected
        if (onSetView) onSetView('customer');
        if (onSetCurrentCustomer) onSetCurrentCustomer(null);
        // Wait longer for form to render
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    });

    // Step 2: Create mock customer
    steps.push({
      target: '[data-tour="customer-status"]',
      title: 'Creating Your Ticket',
      content: 'We are creating a ticket for you. Watch as you get a ticket number.',
      placement: 'bottom',
      view: 'customer',
      action: async (trackAction) => {
        if (onAddTicket) {
          onAddTicket('Tour Customer', '+17581234567', CommsChannel.SMS, branchId);
          // Track for undo
          if (trackAction) {
            trackAction({
              type: 'create_ticket',
              data: { name: 'Tour Customer', phone: '+17581234567' },
              undo: async () => {
                // Undo will be handled by the wrapper in goToStep
              }
            });
          }
          // Wait for ticket to be created - useEffect will handle setting current customer
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      },
      waitForAction: true
    });

    // Step 3: Customer Status - Position
    steps.push({
      target: '[data-tour="customer-eta"]',
      title: 'Your Position',
      content: 'See how many people are ahead of you. See how long you will wait.',
      placement: 'bottom',
      view: 'customer',
      action: async (trackAction) => {
        if (onSetView) onSetView('customer');
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    });

    // Step 4: Reception View
    steps.push({
      target: '[data-tour="reception-dashboard"]',
      title: 'Reception View',
      content: 'Watch the queue move. See who is inside the building and who is waiting outside.',
      placement: 'bottom',
      view: 'receptionist',
      action: async (trackAction) => {
        if (onSetView) onSetView('receptionist');
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    });

    // Step 5: Create more customers to fill building
    steps.push({
      target: '[data-tour="capacity-gate"]',
      title: 'Building Capacity',
      content: 'Only 10 people can be inside. Let us add more customers to show how the queue works.',
      placement: 'bottom',
      view: 'receptionist',
      action: async (trackAction) => {
        // Create 10 more customers (to have customer #11 for promotion demo)
        if (onAddTicket) {
          const createdTicketIds: string[] = [];
          for (let i = 1; i <= 10; i++) {
            onAddTicket(`Customer ${i}`, `+1758123456${i}`, CommsChannel.SMS, branchId);
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          // Track for undo
          if (trackAction) {
            trackAction({
              type: 'create_multiple_tickets',
              data: { count: 10 },
              undo: async () => {
                // Undo will be handled by the wrapper in goToStep
              }
            });
          }
          // Wait for all tickets to be created
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      },
      waitForAction: true
    });

    // Step 6: Move customers into building
    steps.push({
      target: '[data-tour="capacity-gate"]',
      title: 'Customers Enter Building',
      content: 'Watch as customers move into the building. The first 10 customers can enter.',
      placement: 'bottom',
      view: 'receptionist',
      action: async (trackAction) => {
        // Move first 10 customers to IN_BUILDING
        if (onUpdateStatus && tickets.length > 0) {
          const branchTickets = tickets.filter(t => t.branchId === branchId)
            .sort((a, b) => a.queueNumber - b.queueNumber)
            .slice(0, 10);
          
          const statusChanges: Array<{ id: string; oldStatus: any }> = [];
          for (const ticket of branchTickets) {
            if (ticket.status === TicketStatus.REMOTE_WAITING || ticket.status === TicketStatus.WAITING) {
              statusChanges.push({ id: ticket.id, oldStatus: ticket.status });
              onUpdateStatus(ticket.id, TicketStatus.IN_BUILDING, 'system', 'Tour: Customer enters building');
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
          // Track for undo
          if (trackAction) {
            trackAction({
              type: 'update_statuses',
              data: { changes: statusChanges },
              undo: async () => {
                // Undo will be handled by the wrapper in goToStep
              }
            });
          }
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      },
      waitForAction: true
    });

    // Step 7: Show promotion scenario - Customer receives notification
    steps.push({
      target: '[data-tour="customer-notification"]',
      title: 'You Got a Message!',
      content: 'You are now #10! You have 10 minutes to confirm entry or you will go back in line. See the countdown timer.',
      placement: 'bottom',
      view: 'customer',
      action: async (trackAction) => {
        // Find customer #11 and promote them
        if (onUpdateStatus && onSetCurrentCustomer && tickets.length > 0) {
          const branchTickets = tickets.filter(t => t.branchId === branchId)
            .sort((a, b) => a.queueNumber - b.queueNumber);
          const customer11 = branchTickets.find(t => t.queueNumber === 11);
          if (customer11) {
            const oldStatus = customer11.status;
            const oldCurrentCustomer = tickets.find(t => t.id === currentCustomerId)?.id || null;
            // Switch to customer view first
            if (onSetView) onSetView('customer');
            await new Promise(resolve => setTimeout(resolve, 300));
            // Set this customer as the current one to see their view
            onSetCurrentCustomer(customer11.id);
            await new Promise(resolve => setTimeout(resolve, 300));
            // Promote to ELIGIBLE_FOR_ENTRY (this will trigger the notification and countdown)
            onUpdateStatus(customer11.id, TicketStatus.ELIGIBLE_FOR_ENTRY, 'system', 'Tour: Promoted to #10');
            // Track for undo
            if (trackAction) {
              trackAction({
                type: 'promote_customer',
                data: { customerId: customer11.id, oldStatus, oldCurrentCustomer },
                undo: async () => {
                  // Undo will be handled by the wrapper in goToStep
                }
              });
            }
            // Wait for status update and countdown to appear
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      },
      waitForAction: true
    });

    // Step 8: Teller View
    steps.push({
      target: '[data-tour="teller-current"]',
      title: 'Teller View',
      content: 'See the customer you are helping now. See their name and ticket number.',
      placement: 'bottom',
      view: 'teller',
      action: async (trackAction) => {
        if (onSetView) onSetView('teller');
        await new Promise(resolve => setTimeout(resolve, 300));
        // Move first customer to IN_SERVICE
        if (onUpdateStatus && tickets.length > 0) {
          const branchTickets = tickets.filter(t => t.branchId === branchId)
            .sort((a, b) => a.queueNumber - b.queueNumber);
          const firstCustomer = branchTickets.find(t => t.status === TicketStatus.IN_BUILDING);
          if (firstCustomer) {
            const oldStatus = firstCustomer.status;
            onUpdateStatus(firstCustomer.id, TicketStatus.IN_SERVICE, 'teller', 'Tour: Teller starts service');
            // Track for undo
            if (trackAction) {
              trackAction({
                type: 'start_service',
                data: { customerId: firstCustomer.id, oldStatus },
                undo: async () => {
                  // Undo will be handled by the wrapper in goToStep
                }
              });
            }
            await new Promise(resolve => setTimeout(resolve, 400));
          }
        }
      },
      waitForAction: true
    });

    // Step 9: Complete Service
    steps.push({
      target: '[data-tour="teller-complete"]',
      title: 'Complete Service',
      content: 'Click this button when done. It will finish this customer and call the next one.',
      placement: 'top',
      view: 'teller'
    });

    // Step 10: Back to Customer Join
    steps.push({
      target: '[data-tour="customer-join"]',
      title: 'Tour Complete',
      content: 'The tour is complete! You can now join the queue yourself or explore other views.',
      placement: 'bottom',
      view: 'customer',
      action: async (trackAction) => {
        if (onSetView) onSetView('customer');
        if (onSetCurrentCustomer) onSetCurrentCustomer(null);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    });

    return steps;
  }, [tickets, branchId, onAddTicket, onUpdateStatus, onSetView, onSetCurrentCustomer, onRemoveTicket]);

  const startTour = async () => {
    console.log('[Tour] Starting tour');
    setShowWelcomeModal(false);
    setIsRunning(true);
    setCurrentStep(0);
    // Clear any previous step actions
    stepActionsRef.current.clear();
    // Reset to customer view and clear any current customer
    if (onSetView) onSetView('customer');
    if (onSetCurrentCustomer) onSetCurrentCustomer(null);
    // Scroll to top to ensure elements are visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Reduced wait time
    await new Promise(resolve => setTimeout(resolve, 600));
    // Start first step
    await goToStep(0, false);
  };

  const goToStep = async (stepIndex: number, isBackward: boolean = false) => {
    if (stepIndex < 0 || stepIndex >= filteredSteps.length) {
      finishTour();
      return;
    }

    const step = filteredSteps[stepIndex];
    
    console.log(`[Tour] Step ${stepIndex + 1}/${filteredSteps.length}: ${step.title}`, {
      target: step.target,
      view: step.view,
      currentView,
      isBackward
    });

    // If going backward, undo actions from current step first
    if (isBackward && stepIndex < currentStep) {
      const actionsToUndo = stepActionsRef.current.get(currentStep);
      if (actionsToUndo) {
        console.log(`[Tour] Undoing ${actionsToUndo.length} actions from step ${currentStep + 1}`);
        for (const action of actionsToUndo.reverse()) {
          try {
            await action.undo();
          } catch (error) {
            console.error('[Tour] Undo action failed:', error);
          }
        }
        stepActionsRef.current.delete(currentStep);
        // Wait for undo to complete
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Switch view first if needed (reduced wait time)
    if (step.view && step.view !== currentView && onSetView) {
      onSetView(step.view);
      // Reduced wait time for view switch
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Execute action if present (after view switch) - only if going forward
    if (step.action && !isBackward) {
      try {
        // Track actions for this step
        const stepActions: Array<{ type: string; data: any; undo: () => Promise<void> }> = [];
        const trackAction = (action: { type: string; data: any; undo: () => Promise<void> }) => {
          // Wrap undo to ensure it has access to latest tickets
          const wrappedUndo = async () => {
            // Create a new undo function that will use latest tickets when called
            const currentTickets = tickets; // Capture current tickets
            if (action.type === 'create_ticket' && onRemoveTicket) {
              const ticket = currentTickets.find(t => 
                t.name === action.data.name && t.phone === action.data.phone
              );
              if (ticket) {
                onRemoveTicket(ticket.id);
              }
              if (onSetCurrentCustomer) onSetCurrentCustomer(null);
            } else if (action.type === 'create_multiple_tickets' && onRemoveTicket) {
              const customerTickets = currentTickets.filter(t => 
                t.name.startsWith('Customer ') && /^Customer \d+$/.test(t.name)
              );
              for (const ticket of customerTickets) {
                onRemoveTicket(ticket.id);
                await new Promise(resolve => setTimeout(resolve, 30));
              }
            } else if (action.type === 'update_statuses' && onUpdateStatus) {
              for (const change of action.data.changes) {
                onUpdateStatus(change.id, change.oldStatus, 'system', 'Tour: Revert status');
                await new Promise(resolve => setTimeout(resolve, 30));
              }
            } else if (action.type === 'promote_customer') {
              if (onUpdateStatus) {
                onUpdateStatus(action.data.customerId, action.data.oldStatus, 'system', 'Tour: Revert promotion');
              }
              if (onSetCurrentCustomer) {
                // Restore previous current customer or clear it
                if (action.data.oldCurrentCustomer !== undefined && action.data.oldCurrentCustomer !== null) {
                  onSetCurrentCustomer(action.data.oldCurrentCustomer);
                } else {
                  onSetCurrentCustomer(null);
                }
              }
            } else if (action.type === 'start_service' && onUpdateStatus) {
              onUpdateStatus(action.data.customerId, action.data.oldStatus, 'teller', 'Tour: Revert service start');
            } else {
              // Fallback to original undo
              await action.undo();
            }
          };
          stepActions.push({ ...action, undo: wrappedUndo });
        };
        await step.action(trackAction);
        // Store actions for undo
        if (stepActions.length > 0) {
          stepActionsRef.current.set(stepIndex, stepActions);
        }
        if (step.waitForAction) {
          // Reduced wait time
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.error('[Tour] Action failed:', error);
      }
    }

    setCurrentStep(stepIndex);
    
    // Reduced wait time for DOM update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Find target element - try multiple times (reduced wait time)
    let targetElement = document.querySelector(step.target);
    let attempts = 0;
    const maxAttempts = stepIndex === 0 ? 8 : 4; // Reduced attempts
    while (!targetElement && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 150));
      targetElement = document.querySelector(step.target);
      attempts++;
    }
    
    if (!targetElement) {
      // Element not found - for step 1, don't skip, just log warning
      if (stepIndex === 0) {
        console.warn(`[Tour] Step 1: Element not found after ${attempts} attempts, but continuing anyway`, step.target);
        // Still show the tooltip even if element not found for step 1
      } else {
        console.warn(`[Tour] Step ${stepIndex + 1}: Element not found after ${attempts} attempts, skipping`, step.target);
        setTimeout(() => goToStep(stepIndex + 1, false), 300);
        return;
      }
    }

    // Scroll element into view (use requestAnimationFrame for smoother transition)
    if (targetElement) {
      requestAnimationFrame(() => {
        targetElement!.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      
      // Position tooltip (reduced delay)
      setTimeout(() => {
        positionTooltip(targetElement!, step.placement || 'bottom');
      }, 100);
    }
  };

  const positionTooltip = (targetElement: Element, placement: string) => {
    if (!tooltipRef.current || !overlayRef.current) return;

    const targetRect = targetElement.getBoundingClientRect();
    const tooltip = tooltipRef.current;
    const overlay = overlayRef.current;

    // Create spotlight overlay
    overlay.style.clipPath = `polygon(
      0% 0%,
      0% 100%,
      ${targetRect.left}px 100%,
      ${targetRect.left}px ${targetRect.top}px,
      ${targetRect.right}px ${targetRect.top}px,
      ${targetRect.right}px ${targetRect.bottom}px,
      ${targetRect.left}px ${targetRect.bottom}px,
      ${targetRect.left}px 100%,
      100% 100%,
      100% 0%
    )`;

    // Position tooltip
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = targetRect.top - tooltip.offsetHeight - 20;
        left = targetRect.left + (targetRect.width / 2) - (tooltip.offsetWidth / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + 20;
        left = targetRect.left + (targetRect.width / 2) - (tooltip.offsetWidth / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltip.offsetHeight / 2);
        left = targetRect.left - tooltip.offsetWidth - 20;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltip.offsetHeight / 2);
        left = targetRect.right + 20;
        break;
      default:
        top = targetRect.bottom + 20;
        left = targetRect.left + (targetRect.width / 2) - (tooltip.offsetWidth / 2);
    }

    // Keep tooltip in viewport
    const tooltipRect = tooltip.getBoundingClientRect();
    if (left < 20) left = 20;
    if (left + tooltipRect.width > window.innerWidth - 20) {
      left = window.innerWidth - tooltipRect.width - 20;
    }
    if (top < 20) top = 20;
    if (top + tooltipRect.height > window.innerHeight - 20) {
      top = window.innerHeight - tooltipRect.height - 20;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  };

  const nextStep = async () => {
    console.log('[Tour] Next step clicked');
    await goToStep(currentStep + 1, false);
  };

  const prevStep = async () => {
    console.log('[Tour] Previous step clicked - undoing actions');
    await goToStep(currentStep - 1, true);
  };

  const skipTour = () => {
    console.log('[Tour] Tour skipped');
    finishTour();
  };

  const finishTour = () => {
    console.log('[Tour] Tour finished - cleaning up');
    setIsRunning(false);
    setCurrentStep(0);
    setTourCustomerId(null);
    
    // Clean up tour-created tickets
    if (onRemoveTicket && tickets.length > 0) {
      const tourTickets = tickets.filter(t => 
        t.name === 'Tour Customer' || 
        t.name.startsWith('Customer ') && /^Customer \d+$/.test(t.name)
      );
      tourTickets.forEach(ticket => {
        onRemoveTicket(ticket.id);
      });
    }
    
    // Reset to clean state - customer view with no current customer
    if (onSetView) onSetView('customer');
    if (onSetCurrentCustomer) onSetCurrentCustomer(null);
    
    if (overlayRef.current) {
      overlayRef.current.style.clipPath = '';
    }
  };

  const handleWelcomeChoice = (choice: 'start' | 'not-now' | 'dont-show' | 'replay') => {
    console.log('[Tour] Welcome modal choice:', choice);
    setShowWelcomeModal(false);
    
    if (choice === 'start') {
      startTour();
    } else if (choice === 'dont-show') {
      localStorage.setItem('tour_preference', 'never');
    } else if (choice === 'not-now') {
      localStorage.setItem('tour_preference', 'later');
    } else if (choice === 'replay') {
      localStorage.setItem('tour_preference', 'replay');
      startTour();
    }
  };

  const handleHelpClick = () => {
    const preference = localStorage.getItem('tour_preference');
    if (preference === 'never') {
      // Ask if they want to see it anyway
      if (window.confirm('You previously chose not to see the tour. Would you like to see it now?')) {
        startTour();
      }
    } else {
      startTour();
    }
  };

  // Listen for custom event from footer link
  useEffect(() => {
    const handleStartTour = () => {
      console.log('[Tour] Help/Tour link clicked');
      const preference = localStorage.getItem('tour_preference');
      if (preference === 'never') {
        if (window.confirm('You previously chose not to see the tour. Would you like to see it now?')) {
          startTour();
        }
      } else {
        startTour();
      }
    };
    window.addEventListener('start-tour', handleStartTour);
    return () => window.removeEventListener('start-tour', handleStartTour);
  }, [currentView]); // Include currentView to ensure tour steps are filtered correctly

  const currentStepData = filteredSteps[currentStep];

  return (
    <>
      {/* Help Button - Always visible when not in welcome modal */}
      {!showWelcomeModal && !isRunning && (
        <button
          onClick={handleHelpClick}
          className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all z-40 flex items-center gap-2"
          title="Help / Tour"
          data-tour="help-button"
        >
          <HelpCircle size={20} />
          <span className="hidden sm:inline text-sm font-medium">Help</span>
        </button>
      )}

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <HelpCircle size={48} className="mx-auto text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome!</h2>
              <p className="text-slate-600 text-lg">Would you like a quick tour?</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleWelcomeChoice('start')}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
              >
                Start Tour
              </button>
              <button
                onClick={() => handleWelcomeChoice('not-now')}
                className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all"
              >
                Not Now
              </button>
              <button
                onClick={() => handleWelcomeChoice('dont-show')}
                className="w-full py-3 bg-slate-50 text-slate-500 rounded-xl font-medium hover:bg-slate-100 transition-all"
              >
                Don't Show Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tour Overlay and Tooltip */}
      {isRunning && currentStepData && (
        <>
          {/* Spotlight Overlay */}
          <div
            ref={overlayRef}
            className="fixed inset-0 bg-black/60 z-[90] pointer-events-none"
            style={{ transition: 'clip-path 0.3s ease' }}
          />

          {/* Tooltip */}
          <div
            ref={tooltipRef}
            className="fixed z-[100] bg-white rounded-xl shadow-2xl p-6 max-w-sm pointer-events-auto"
            style={{ transition: 'all 0.3s ease' }}
          >
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-blue-600">
                {currentStep + 1} / {filteredSteps.length}
              </span>
              <button
                onClick={skipTour}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-base text-slate-600 mb-6 leading-relaxed">
              {currentStepData.content}
            </p>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <div className="flex gap-2">
                <button
                  onClick={skipTour}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Skip
                </button>
                {currentStep === filteredSteps.length - 1 ? (
                  <button
                    onClick={finishTour}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
                  >
                    Finish
                  </button>
                ) : (
                  <button
                    onClick={nextStep}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      </>
    );
  }

export default ProductTour;
