describe('Customer Subscriptions', () => {
  beforeEach(() => {
    cy.loginAsCustomer();
    cy.visit('/customer/subscriptions');
  });

  it('loads subscriptions page', () => {
    cy.assertPath('/customer/subscriptions');
  });

  it('displays subscription cards', () => {
    cy.get('[class*="card"]').should('exist');
  });
});
