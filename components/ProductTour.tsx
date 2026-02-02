import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

interface TourStep {
  target: string; // CSS selector or data attribute
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  view?: 'customer' | 'receptionist' | 'teller' | 'manager'; // Required view for this step
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
}

const ProductTour: React.FC<ProductTourProps> = ({ currentView }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check if tour should be shown on first load
  useEffect(() => {
    const tourPreference = localStorage.getItem('tour_preference');
    if (tourPreference === null) {
      // First time - show welcome modal
      setShowWelcomeModal(true);
    }
  }, []);

  // Filter steps based on current view
  const getFilteredSteps = () => {
    return TOUR_STEPS.filter(step => !step.view || step.view === currentView);
  };

  const filteredSteps = getFilteredSteps();

  const startTour = () => {
    console.log('[Tour] Starting tour');
    setShowWelcomeModal(false);
    setIsRunning(true);
    setCurrentStep(0);
    // Scroll to top to ensure elements are visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      goToStep(0);
    }, 300);
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= filteredSteps.length) {
      finishTour();
      return;
    }

    setCurrentStep(stepIndex);
    const step = filteredSteps[stepIndex];
    
    console.log(`[Tour] Step ${stepIndex + 1}/${filteredSteps.length}: ${step.title}`, {
      target: step.target,
      view: step.view,
      currentView
    });
    
    // Find target element
    const targetElement = document.querySelector(step.target);
    
    if (!targetElement) {
      // Element not found - skip to next step
      console.warn(`[Tour] Step ${stepIndex + 1}: Element not found, skipping`, step.target);
      setTimeout(() => goToStep(stepIndex + 1), 500);
      return;
    }

    // Scroll element into view
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Position tooltip
    setTimeout(() => {
      positionTooltip(targetElement, step.placement || 'bottom');
    }, 300);
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

  const nextStep = () => {
    console.log('[Tour] Next step clicked');
    goToStep(currentStep + 1);
  };

  const prevStep = () => {
    console.log('[Tour] Previous step clicked');
    goToStep(currentStep - 1);
  };

  const skipTour = () => {
    console.log('[Tour] Tour skipped');
    finishTour();
  };

  const finishTour = () => {
    console.log('[Tour] Tour finished');
    setIsRunning(false);
    setCurrentStep(0);
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

  if (!isRunning && !showWelcomeModal) {
    return (
      <button
        onClick={handleHelpClick}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all z-40 flex items-center gap-2"
        title="Help / Tour"
        data-tour="help-button"
      >
        <HelpCircle size={20} />
        <span className="hidden sm:inline text-sm font-medium">Help</span>
      </button>
    );
  }

  const currentStepData = filteredSteps[currentStep];

  return (
    <>
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
};

export default ProductTour;
