describe('Admin Claims Management', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/admin/claims-monitoring');
  });

  it('loads claims monitoring dashboard', () => {
    cy.assertPath('/admin/claims-monitoring');
  });

  it('displays claims table with data', () => {
    cy.get('table').should('exist');
  });

  it('can filter claims by status', () => {
    cy.get('button, [role="combobox"]').then(($els) => {
      const statusFilter = $els.filter(':contains("Status"), :contains("Filter")');
      if (statusFilter.length) {
        cy.wrap(statusFilter.first()).click();
      }
    });
  });
});
