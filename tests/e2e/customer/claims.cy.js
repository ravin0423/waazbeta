describe('Customer Claims', () => {
  beforeEach(() => {
    cy.loginAsCustomer();
    cy.visit('/customer/claims');
  });

  it('loads claims page', () => {
    cy.assertPath('/customer/claims');
  });

  it('displays claims list or empty state', () => {
    cy.get('[class*="card"], table').should('exist');
  });

  it('can start a new claim', () => {
    cy.contains(/new claim|file.*claim|submit.*claim/i).then(($btn) => {
      if ($btn.length) cy.wrap($btn).click();
    });
  });
});
