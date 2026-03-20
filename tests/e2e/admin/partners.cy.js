describe('Admin Partners Management', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/admin/partners');
  });

  it('loads partners management page', () => {
    cy.assertPath('/admin/partners');
  });

  it('displays partner list', () => {
    cy.get('table').should('exist');
  });
});
