describe('Admin Dashboard', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/admin');
  });

  it('loads the admin dashboard with KPI cards', () => {
    cy.assertPath('/admin');
    cy.get('h1').should('contain.text', /dashboard/i);
  });

  it('displays stats cards with data', () => {
    cy.get('[class*="card"]').should('have.length.gte', 3);
  });

  it('navigates to all admin sections', () => {
    const sections = [
      { nav: 'Device', path: '/admin/device' },
      { nav: 'Claims', path: '/admin/claims' },
      { nav: 'Customer', path: '/admin/customer' },
    ];
    sections.forEach(({ nav, path }) => {
      cy.sidebarNav(nav);
      cy.url().should('include', path);
      cy.go('back');
    });
  });
});
