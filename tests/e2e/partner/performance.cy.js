describe('Partner Performance', () => {
  beforeEach(() => {
    cy.loginAsPartner();
    cy.visit('/partner/performance');
  });

  it('loads performance page', () => {
    cy.assertPath('/partner/performance');
  });

  it('displays performance metrics', () => {
    cy.get('[class*="card"]').should('have.length.gte', 1);
  });
});
