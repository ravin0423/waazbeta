describe('Admin Customer Database', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/admin/customers');
  });

  it('loads customer database page', () => {
    cy.assertPath('/admin/customers');
  });

  it('displays customers in a table', () => {
    cy.get('table').should('exist');
  });

  it('can search for customers', () => {
    cy.get('input[placeholder*="earch"]').first().type('test');
  });
});
