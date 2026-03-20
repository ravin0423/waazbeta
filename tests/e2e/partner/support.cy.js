describe('Partner Support Tickets', () => {
  beforeEach(() => {
    cy.loginAsPartner();
    cy.visit('/partner/tickets');
  });

  it('loads support tickets page', () => {
    cy.assertPath('/partner/tickets');
  });

  it('can create a new ticket', () => {
    cy.fixture('tickets').then((data) => {
      cy.clickButton('New Ticket').then(() => {
        // Fill form if modal opens
      });
    });
  });
});
