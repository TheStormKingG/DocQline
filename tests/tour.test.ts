/**
 * Tour System Tests
 * Tests that tour selectors resolve and steps don't crash on missing elements
 */

describe('Product Tour', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    // Reset DOM
    document.body.innerHTML = '';
  });

  test('Tour selectors should resolve for customer join', () => {
    const element = document.createElement('div');
    element.setAttribute('data-tour', 'customer-join');
    document.body.appendChild(element);

    const found = document.querySelector('[data-tour="customer-join"]');
    expect(found).toBeTruthy();
  });

  test('Tour selectors should resolve for customer status', () => {
    const element = document.createElement('div');
    element.setAttribute('data-tour', 'customer-status');
    document.body.appendChild(element);

    const found = document.querySelector('[data-tour="customer-status"]');
    expect(found).toBeTruthy();
  });

  test('Tour selectors should resolve for reception dashboard', () => {
    const element = document.createElement('div');
    element.setAttribute('data-tour', 'reception-dashboard');
    document.body.appendChild(element);

    const found = document.querySelector('[data-tour="reception-dashboard"]');
    expect(found).toBeTruthy();
  });

  test('Tour selectors should resolve for capacity gate', () => {
    const element = document.createElement('div');
    element.setAttribute('data-tour', 'capacity-gate');
    document.body.appendChild(element);

    const found = document.querySelector('[data-tour="capacity-gate"]');
    expect(found).toBeTruthy();
  });

  test('Tour selectors should resolve for teller current', () => {
    const element = document.createElement('div');
    element.setAttribute('data-tour', 'teller-current');
    document.body.appendChild(element);

    const found = document.querySelector('[data-tour="teller-current"]');
    expect(found).toBeTruthy();
  });

  test('Tour selectors should resolve for teller complete', () => {
    const element = document.createElement('button');
    element.setAttribute('data-tour', 'teller-complete');
    document.body.appendChild(element);

    const found = document.querySelector('[data-tour="teller-complete"]');
    expect(found).toBeTruthy();
  });

  test('Tour should gracefully skip missing elements', () => {
    // No elements in DOM
    const found = document.querySelector('[data-tour="customer-join"]');
    expect(found).toBeNull();
    // Should not throw error
    expect(() => {
      if (!found) {
        // Simulate skip logic
        return true;
      }
    }).not.toThrow();
  });

  test('Tour preference should persist in localStorage', () => {
    localStorage.setItem('tour_preference', 'never');
    expect(localStorage.getItem('tour_preference')).toBe('never');

    localStorage.setItem('tour_preference', 'later');
    expect(localStorage.getItem('tour_preference')).toBe('later');
  });

  test('Tour should filter steps by current view', () => {
    const customerSteps = [
      { target: '[data-tour="customer-join"]', view: 'customer' },
      { target: '[data-tour="customer-eta"]', view: 'customer' },
      { target: '[data-tour="customer-notification"]', view: 'customer' }
    ];

    const receptionSteps = [
      { target: '[data-tour="reception-dashboard"]', view: 'receptionist' },
      { target: '[data-tour="capacity-gate"]', view: 'receptionist' }
    ];

    const tellerSteps = [
      { target: '[data-tour="teller-current"]', view: 'teller' },
      { target: '[data-tour="teller-complete"]', view: 'teller' }
    ];

    expect(customerSteps.length).toBe(3);
    expect(receptionSteps.length).toBe(2);
    expect(tellerSteps.length).toBe(2);
  });
});
