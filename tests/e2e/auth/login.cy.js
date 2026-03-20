describe('Authentication', () => {
  it('shows login page', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
  });

  it('rejects invalid credentials', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('invalid@test.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.contains('button', /sign in|log in/i).click();
    cy.url().should('include', '/login');
  });

  it('redirects unauthenticated users to login', () => {
    cy.visit('/admin');
    cy.url().should('include', '/login');
  });

  it('redirects to correct portal after login', () => {
    cy.fixture('users').then((users) => {
      cy.loginViaUI(users.customer.email, users.customer.password);
      cy.url().should('include', '/customer');
    });
  });
});
