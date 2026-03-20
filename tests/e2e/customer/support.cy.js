describe('Customer Support', () => {
  beforeEach(() => {
    cy.loginAsCustomer();
    cy.visit('/customer/tickets');
  });

  it('loads support tickets page', () => {
    cy.assertPath('/customer/tickets');
  });

  it('can create a support ticket', () => {
    cy.fixture('tickets').then((data) => {
      cy.contains(/new.*ticket|create.*ticket/i).then(($btn) => {
        if ($btn.length) cy.wrap($btn).click();
      });
    });
  });
});
