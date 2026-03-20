describe('Customer Devices', () => {
  beforeEach(() => {
    cy.loginAsCustomer();
    cy.visit('/customer/devices');
  });

  it('loads devices page', () => {
    cy.assertPath('/customer/devices');
  });

  it('displays device cards or empty state', () => {
    cy.get('[class*="card"]').should('exist');
  });

  it('can initiate device onboarding', () => {
    cy.contains(/add|register|onboard/i).then(($btn) => {
      if ($btn.length) cy.wrap($btn).click();
    });
  });
});
