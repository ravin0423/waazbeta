describe('Customer Feedback', () => {
  beforeEach(() => {
    cy.loginAsCustomer();
    cy.visit('/customer/feedback');
  });

  it('loads feedback page', () => {
    cy.assertPath('/customer/feedback');
  });

  it('displays feedback form or history', () => {
    cy.get('[class*="card"]').should('exist');
  });
});
