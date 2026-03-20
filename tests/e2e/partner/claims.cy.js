describe('Partner Claims', () => {
  beforeEach(() => {
    cy.loginAsPartner();
    cy.visit('/partner/customers');
  });

  it('loads assigned claims page', () => {
    cy.assertPath('/partner/customers');
  });

  it('displays claims list', () => {
    cy.get('table, [class*="card"]').should('exist');
  });
});
