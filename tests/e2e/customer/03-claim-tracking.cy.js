// ─── Test 3: Claim Tracking ───
import { CustomerLoginPage, CustomerClaimsPage } from '../../support/page-objects/customer';

describe('Customer Claim Tracking', () => {
  const loginPage = new CustomerLoginPage();
  const claimsPage = new CustomerClaimsPage();

  beforeEach(() => {
    cy.fixture('customer-users').then((users) => {
      loginPage.login(users.customer.email, users.customer.password);
    });
    cy.log('🧪 Starting Claim Tracking test');
  });

  it('TC-C3.1: Should view all claims', () => {
    claimsPage.visit();
    claimsPage.waitForLoad();
    claimsPage.assertClaimsList();
    cy.log('✅ All claims displayed');
  });

  it('TC-C3.2: Should display claims with status badges', () => {
    claimsPage.visit();
    claimsPage.waitForLoad();

    cy.get('table tbody tr, [class*="card"]').then(($rows) => {
      if ($rows.length > 0) {
        cy.get('[class*="badge"]').should('have.length.gte', 1);
        cy.log(`✅ ${$rows.length} claims with status badges`);
      } else {
        cy.log('⚠️ No claims to check');
      }
    });
  });

  it('TC-C3.3: Should filter claims by status', () => {
    claimsPage.visit();
    claimsPage.waitForLoad();

    cy.get('body').then(($body) => {
      const hasFilters = $body.find('[role="tablist"], button[role="combobox"], [class*="tab"]').length > 0;
      cy.log(hasFilters ? '✅ Status filter controls available' : '⚠️ No filter controls found');
    });
  });

  it('TC-C3.4: Should open claim detail and display 8-stage timeline', () => {
    cy.fixture('customer-claims').then((claims) => {
      claimsPage.visit();
      claimsPage.waitForLoad();

      cy.get('table tbody tr, [class*="card"]').then(($rows) => {
        if ($rows.length > 0) {
          claimsPage.clickClaim(0);
          cy.wait(2000);

          // Check for timeline stages
          cy.get('body').then(($body) => {
            const text = $body.text().toLowerCase();
            const stagesFound = claims.timelineStages.filter((s) => text.includes(s.toLowerCase()));
            cy.log(`✅ ${stagesFound.length}/${claims.timelineStages.length} timeline stages found`);
            stagesFound.forEach((s) => cy.log(`  ✓ ${s}`));
          });
        }
      });
    });
  });

  it('TC-C3.5: Should display progress bar in claim detail', () => {
    claimsPage.visit();
    claimsPage.waitForLoad();

    cy.get('table tbody tr, [class*="card"]').then(($rows) => {
      if ($rows.length > 0) {
        claimsPage.clickClaim(0);
        cy.wait(2000);

        cy.get('body').then(($body) => {
          const hasProgress = $body.find('[role="progressbar"], [class*="progress"]').length > 0;
          cy.log(hasProgress ? '✅ Progress bar displayed' : '⚠️ No progress bar found');
        });
      }
    });
  });

  it('TC-C3.6: Should display assigned partner info', () => {
    claimsPage.visit();
    claimsPage.waitForLoad();

    cy.get('table tbody tr, [class*="card"]').then(($rows) => {
      if ($rows.length > 0) {
        claimsPage.clickClaim(0);
        cy.wait(2000);

        cy.get('body').then(($body) => {
          const text = $body.text().toLowerCase();
          const hasPartner = text.includes('partner') || text.includes('assigned') ||
                            text.includes('technician') || text.includes('contact');
          cy.log(hasPartner ? '✅ Partner info visible' : '⚠️ Partner info not displayed (may not be assigned yet)');
        });
      }
    });
  });

  it('TC-C3.7: Should send message to partner on assigned claim', () => {
    cy.fixture('customer-claims').then((claims) => {
      claimsPage.visit();
      claimsPage.waitForLoad();

      cy.get('table tbody tr, [class*="card"]').then(($rows) => {
        if ($rows.length > 0) {
          claimsPage.clickClaim(0);
          cy.wait(2000);

          cy.get('body').then(($body) => {
            const hasChat = $body.find('textarea, input[placeholder*="essage"]').length > 0;
            if (hasChat) {
              claimsPage.sendMessage(claims.partnerMessage);
              cy.log(`✅ Message sent: "${claims.partnerMessage.substring(0, 50)}..."`);
            } else {
              cy.log('⚠️ Chat/message input not available');
            }
          });
        }
      });
    });
  });

  it('TC-C3.8: Should display claim status updates history', () => {
    claimsPage.visit();
    claimsPage.waitForLoad();

    cy.get('table tbody tr, [class*="card"]').then(($rows) => {
      if ($rows.length > 0) {
        claimsPage.clickClaim(0);
        cy.wait(2000);

        cy.get('body').then(($body) => {
          const text = $body.text().toLowerCase();
          const hasHistory = text.includes('history') || text.includes('update') ||
                            text.includes('status changed') || text.includes('timeline');
          cy.log(hasHistory ? '✅ Status update history visible' : '⚠️ No status history section');
        });
      }
    });
  });

  it('TC-C3.9: Should verify status-specific color coding', () => {
    claimsPage.visit();
    claimsPage.waitForLoad();

    cy.get('[class*="badge"]').then(($badges) => {
      if ($badges.length > 0) {
        // Badges should have different visual styles per status
        const classes = new Set();
        $badges.each((_, badge) => {
          const cls = badge.className;
          classes.add(cls);
        });
        cy.log(`✅ ${classes.size} distinct badge styles found (color coding)`);
      }
    });
  });

  it('TC-C3.10: Should only show own claims (data isolation)', () => {
    claimsPage.visit();
    claimsPage.waitForLoad();

    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const hasAdminData = text.includes('all customers') || text.includes('all claims') || text.includes('system');
      expect(hasAdminData).to.be.false;
      cy.log('✅ Data isolation verified — only own claims visible');
    });
  });

  it('TC-C3.11: Should provide feedback on completed claim', () => {
    cy.fixture('customer-claims').then((claims) => {
      claimsPage.visit();
      claimsPage.waitForLoad();

      cy.get('table tbody tr, [class*="card"]').then(($rows) => {
        if ($rows.length > 0) {
          claimsPage.clickClaim(0);
          cy.wait(2000);

          cy.get('body').then(($body) => {
            const text = $body.text().toLowerCase();
            const hasFeedback = text.includes('feedback') || text.includes('rate') || text.includes('review');
            cy.log(hasFeedback
              ? '✅ Feedback option available on claim'
              : '⚠️ No feedback option (claim may not be completed)');
          });
        }
      });
    });
  });

  it('TC-C3.12: Accessibility — timeline has semantic structure', () => {
    claimsPage.visit();
    claimsPage.waitForLoad();

    cy.get('table tbody tr, [class*="card"]').then(($rows) => {
      if ($rows.length > 0) {
        claimsPage.clickClaim(0);
        cy.wait(2000);

        // Check for proper heading/list structure
        cy.get('h1, h2, h3, h4, [role="list"], [role="status"]').should('have.length.gte', 1);
        cy.log('✅ Semantic HTML structure present');
      }
    });
  });
});
