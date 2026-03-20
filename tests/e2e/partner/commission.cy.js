describe('Partner Commissions', () => {
  beforeEach(() => {
    cy.loginAsPartner();
    cy.visit('/partner/commissions');
  });

  it('loads commissions page', () => {
    cy.assertPath('/partner/commissions');
  });

  it('displays commission data', () => {
    cy.get('table, [class*="card"]').should('exist');
  });
});
