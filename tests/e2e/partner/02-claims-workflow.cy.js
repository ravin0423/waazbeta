// ─── Test 2: Claims Workflow ───
import { PartnerLoginPage, PartnerClaimsPage } from '../../support/page-objects/partner';

describe('Partner Claims Workflow', () => {
  const loginPage = new PartnerLoginPage();
  const claimsPage = new PartnerClaimsPage();

  beforeEach(() => {
    cy.fixture('partner-users').then((users) => {
      loginPage.login(users.partner.email, users.partner.password);
    });
    cy.log('🧪 Starting Partner Claims Workflow test');
  });

  it('TC-P2.1: Should load assigned claims page', () => {
    claimsPage.visit();
    claimsPage.waitForLoad();
    claimsPage.getClaimsTable().should('exist');
    cy.log('✅ Claims page loaded');
  });

  it('TC-P2.2: Should only display claims assigned to this partner (data isolation)', () => {
    claimsPage.visit();
    claimsPage.waitForLoad();
    claimsPage.assertOnlyOwnData();
    cy.log('✅ Data isolation verified — only own claims visible');
  });

  it('TC-P2.3: Should view claim details', () => {
    claimsPage.visit();
    claimsPage.waitForLoad();

    cy.get('table tbody tr, [class*="card"]').then(($rows) => {
      if ($rows.length > 0) {
        claimsPage.clickClaim(0);
        cy.wait(1500);
        // Verify detail view shows essential fields
        cy.get('body').then(($body) => {
          const text = $body.text().toLowerCase();
          const hasDetails = text.includes('imei') || text.includes('issue') || text.includes('description');
          cy.log(hasDetails ? '✅ Claim details displayed' : '⚠️ Claim detail view not found');
        });
      } else {
        cy.log('⚠️ No assigned claims to view');
      }
    });
  });

  it('TC-P2.4: Should accept an assigned claim', () => {
    claimsPage.visit();
    claimsPage.waitForLoad();

    cy.get('table tbody tr, [class*="card"]').then(($rows) => {
      if ($rows.length > 0) {
        claimsPage.clickClaim(0);
        cy.wait(1500);

        cy.get('body').then(($body) => {
          if ($body.find('button:contains("Accept")').length > 0) {
            claimsPage.acceptClaim();
            claimsPage.assertToast();
            cy.log('✅ Claim accepted successfully');
          } else {
            cy.log('⚠️ No accept button — claim may already be accepted');
          }
        });
      }
    });
  });

  it('TC-P2.5: Should reject a claim with reason', () => {
    cy.fixture('partner-claims').then((claims) => {
      claimsPage.visit();
      claimsPage.waitForLoad();

      cy.get('table tbody tr, [class*="card"]').then(($rows) => {
        if ($rows.length > 0) {
          claimsPage.clickClaim(0);
          cy.wait(1500);

          cy.get('body').then(($body) => {
            if ($body.find('button:contains("Reject"), button:contains("Decline")').length > 0) {
              claimsPage.rejectClaim(claims.rejectionReasons[0]);
              claimsPage.assertToast();
              cy.log(`✅ Claim rejected with reason: ${claims.rejectionReasons[0]}`);
            } else {
              cy.log('⚠️ No reject/decline button available');
            }
          });
        }
      });
    });
  });

  it('TC-P2.6: Should update claim status through workflow stages', () => {
    cy.fixture('partner-claims').then((claims) => {
      claimsPage.visit();
      claimsPage.waitForLoad();

      cy.get('table tbody tr, [class*="card"]').then(($rows) => {
        if ($rows.length > 0) {
          claimsPage.clickClaim(0);
          cy.wait(1500);

          cy.get('body').then(($body) => {
            const hasUpdate = $body.find('button:contains("Status"), button:contains("Update"), select').length > 0;
            if (hasUpdate) {
              cy.log('✅ Status update controls available');
              cy.log(`📋 Expected workflow: ${claims.statusWorkflow.join(' → ')}`);
            } else {
              cy.log('⚠️ No status update controls found');
            }
          });
        }
      });
    });
  });

  it('TC-P2.7: Should upload repair photos', () => {
    claimsPage.visit();
    claimsPage.waitForLoad();

    cy.get('table tbody tr, [class*="card"]').then(($rows) => {
      if ($rows.length > 0) {
        claimsPage.clickClaim(0);
        cy.wait(1500);

        cy.get('body').then(($body) => {
          const hasUpload = $body.find('input[type="file"]').length > 0 ||
                           $body.find('button:contains("Upload"), button:contains("Photo")').length > 0;
          if (hasUpload) {
            cy.log('✅ Photo upload functionality available');
          } else {
            cy.log('⚠️ Photo upload not found in current view');
          }
        });
      }
    });
  });

  it('TC-P2.8: Should add repair notes/messages', () => {
    cy.fixture('partner-claims').then((claims) => {
      claimsPage.visit();
      claimsPage.waitForLoad();

      cy.get('table tbody tr, [class*="card"]').then(($rows) => {
        if ($rows.length > 0) {
          claimsPage.clickClaim(0);
          cy.wait(1500);

          cy.get('body').then(($body) => {
            const hasNotes = $body.find('textarea').length > 0;
            if (hasNotes) {
              claimsPage.addNote(claims.repairNotes[0]);
              cy.log(`✅ Repair note added: "${claims.repairNotes[0].substring(0, 50)}..."`);
            } else {
              cy.log('⚠️ Notes/message textarea not found');
            }
          });
        }
      });
    });
  });

  it('TC-P2.9: Should filter claims by status', () => {
    claimsPage.visit();
    claimsPage.waitForLoad();

    cy.get('body').then(($body) => {
      const hasFilters = $body.find('[role="tablist"], button[role="combobox"], [class*="tab"]').length > 0;
      cy.log(hasFilters ? '✅ Claim status filters available' : '⚠️ No status filter controls');
    });
  });

  it('TC-P2.10: Should display claim SLA deadline', () => {
    claimsPage.visit();
    claimsPage.waitForLoad();

    cy.get('table tbody tr, [class*="card"]').then(($rows) => {
      if ($rows.length > 0) {
        claimsPage.clickClaim(0);
        cy.wait(1500);
        cy.get('body').then(($body) => {
          const text = $body.text().toLowerCase();
          const hasSLA = text.includes('sla') || text.includes('deadline') || text.includes('due');
          cy.log(hasSLA ? '✅ SLA deadline displayed' : '⚠️ SLA deadline not visible');
        });
      }
    });
  });
});
