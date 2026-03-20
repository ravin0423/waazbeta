describe('Admin Finance', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('loads finance overview', () => {
    cy.visit('/admin/finance');
    cy.assertPath('/admin/finance');
  });

  it('loads transactions page', () => {
    cy.visit('/admin/finance/transactions');
    cy.assertPath('/admin/finance/transactions');
  });

  it('loads GST page', () => {
    cy.visit('/admin/finance/gst');
    cy.assertPath('/admin/finance/gst');
  });

  it('loads partner payments page', () => {
    cy.visit('/admin/finance/partner-payments');
    cy.assertPath('/admin/finance/partner-payments');
  });
});
