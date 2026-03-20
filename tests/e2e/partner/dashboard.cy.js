describe('Partner Dashboard', () => {
  beforeEach(() => {
    cy.loginAsPartner();
    cy.visit('/partner');
  });

  it('loads partner dashboard', () => {
    cy.assertPath('/partner');
    cy.get('h1').should('exist');
  });

  it('displays KPI stats', () => {
    cy.get('[class*="card"]').should('have.length.gte', 2);
  });
});
