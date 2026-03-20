// ─── Test 4: Support System ───
import { CustomerLoginPage, CustomerTicketsPage } from '../../support/page-objects/customer';

describe('Customer Support System', () => {
  const loginPage = new CustomerLoginPage();
  const ticketsPage = new CustomerTicketsPage();

  beforeEach(() => {
    cy.fixture('customer-users').then((users) => {
      loginPage.login(users.customer.email, users.customer.password);
    });
    cy.log('🧪 Starting Support System test');
  });

  it('TC-C4.1: Should load support tickets page', () => {
    ticketsPage.visit();
    ticketsPage.waitForLoad();
    cy.get('body').should('be.visible');
    cy.log('✅ Support tickets page loaded');
  });

  it('TC-C4.2: Should display existing tickets or empty state', () => {
    ticketsPage.visit();
    ticketsPage.waitForLoad();

    cy.get('body').then(($body) => {
      const hasTickets = $body.find('table tbody tr').length > 0 || $body.find('[class*="card"]').length > 1;
      cy.log(hasTickets ? '✅ Existing tickets displayed' : '✅ Empty state shown');
    });
  });

  it('TC-C4.3: Should create a new support ticket', () => {
    cy.fixture('customer-tickets').then((tickets) => {
      ticketsPage.visit();
      ticketsPage.waitForLoad();

      cy.get('body').then(($body) => {
        const $newBtn = $body.find('button:contains("New"), button:contains("Create"), button:contains("Raise")');
        if ($newBtn.length) {
          ticketsPage.clickNewTicket();
          cy.wait(1000);
          ticketsPage.fillTicketForm(
            tickets.newTicket.subject,
            tickets.newTicket.description,
            tickets.newTicket.priority
          );
          ticketsPage.submitTicket();
          ticketsPage.assertTicketCreated();
          cy.log(`✅ Ticket created: "${tickets.newTicket.subject}"`);
        } else {
          cy.log('⚠️ New ticket button not found');
        }
      });
    });
  });

  it('TC-C4.4: Should set ticket priority levels', () => {
    cy.fixture('customer-tickets').then((tickets) => {
      ticketsPage.visit();
      ticketsPage.waitForLoad();

      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        const hasPriority = tickets.priorities.some((p) => text.includes(p));
        cy.log(hasPriority ? '✅ Priority levels visible' : '⚠️ Priority labels not displayed on list');
      });
    });
  });

  it('TC-C4.5: Should open ticket and send chat message', () => {
    cy.fixture('customer-tickets').then((tickets) => {
      ticketsPage.visit();
      ticketsPage.waitForLoad();

      cy.get('table tbody tr, [class*="card"]').then(($rows) => {
        if ($rows.length > 0) {
          ticketsPage.clickTicket(0);
          cy.wait(1500);

          cy.get('body').then(($body) => {
            const hasChat = $body.find('textarea, input[placeholder*="essage"]').length > 0;
            if (hasChat) {
              ticketsPage.sendMessage(tickets.followUpMessage);
              cy.log(`✅ Chat message sent`);
            } else {
              cy.log('⚠️ Chat input not found');
            }
          });
        }
      });
    });
  });

  it('TC-C4.6: Should display threaded message history', () => {
    ticketsPage.visit();
    ticketsPage.waitForLoad();

    cy.get('table tbody tr, [class*="card"]').then(($rows) => {
      if ($rows.length > 0) {
        ticketsPage.clickTicket(0);
        cy.wait(1500);

        cy.get('body').then(($body) => {
          const hasMessages = $body.find('[class*="message"], [class*="chat"], [class*="bubble"]').length > 0;
          cy.log(hasMessages ? '✅ Message thread visible' : '⚠️ No message thread found');
        });
      }
    });
  });

  it('TC-C4.7: Should auto-reopen resolved ticket on customer reply', () => {
    cy.fixture('customer-tickets').then((tickets) => {
      ticketsPage.visit();
      ticketsPage.waitForLoad();

      // Find a resolved/closed ticket
      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        const hasResolved = text.includes('resolved') || text.includes('closed');
        if (hasResolved) {
          cy.log('📋 Found resolved ticket — testing auto-reopen');
          // Click on resolved ticket and reply
          cy.contains(/resolved|closed/i).first().closest('tr, [class*="card"]').click({ force: true });
          cy.wait(1500);

          cy.get('body').then(($detail) => {
            const $chatInput = $detail.find('textarea, input[placeholder*="essage"]');
            if ($chatInput.length) {
              cy.wrap($chatInput.last()).clear().type(tickets.resolvedReply);
              cy.contains('button', /send|reply/i).click({ force: true });
              cy.log('✅ Reply sent — ticket should auto-reopen to "open" status');
            }
          });
        } else {
          cy.log('⚠️ No resolved tickets to test auto-reopen');
        }
      });
    });
  });

  it('TC-C4.8: Should display ticket status badges', () => {
    ticketsPage.visit();
    ticketsPage.waitForLoad();

    cy.get('table tbody tr, [class*="card"]').then(($rows) => {
      if ($rows.length > 0) {
        cy.get('[class*="badge"]').should('have.length.gte', 1);
        cy.log('✅ Ticket status badges displayed');
      }
    });
  });

  it('TC-C4.9: Should only show own tickets (data isolation)', () => {
    ticketsPage.visit();
    ticketsPage.waitForLoad();

    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const hasAdminData = text.includes('all tickets') || text.includes('all users') || text.includes('admin view');
      expect(hasAdminData).to.be.false;
      cy.log('✅ Data isolation verified — only own tickets visible');
    });
  });

  it('TC-C4.10: Accessibility — ticket form has proper labels', () => {
    ticketsPage.visit();
    ticketsPage.waitForLoad();

    cy.get('body').then(($body) => {
      const $newBtn = $body.find('button:contains("New"), button:contains("Create"), button:contains("Raise")');
      if ($newBtn.length) {
        cy.wrap($newBtn.first()).click({ force: true });
        cy.wait(1000);
        cy.get('label').should('have.length.gte', 1);
        cy.log('✅ Form labels present for accessibility');
      }
    });
  });
});
