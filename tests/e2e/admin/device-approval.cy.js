describe('Admin Device Approval', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/admin/device-approvals');
  });

  it('loads the device approvals page', () => {
    cy.assertPath('/admin/device-approvals');
  });

  it('displays pending devices table', () => {
    cy.get('table').should('exist');
  });

  it('can view device details', () => {
    cy.get('table tbody tr').first().then(($row) => {
      if ($row.length) {
        cy.wrap($row).click();
      }
    });
  });
});
