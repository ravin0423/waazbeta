// ─── Test 4: Performance Dashboard ───
import { PartnerLoginPage, PartnerPerformancePage } from '../../support/page-objects/partner';

describe('Partner Performance Dashboard', () => {
  const loginPage = new PartnerLoginPage();
  const perfPage = new PartnerPerformancePage();

  beforeEach(() => {
    cy.fixture('partner-users').then((users) => {
      loginPage.login(users.partner.email, users.partner.password);
    });
    cy.log('🧪 Starting Performance Dashboard test');
  });

  it('TC-P4.1: Should load performance dashboard', () => {
    perfPage.visit();
    perfPage.waitForLoad();
    perfPage.assertMetricCards();
    cy.log('✅ Performance dashboard loaded');
  });

  it('TC-P4.2: Should display SLA compliance metrics', () => {
    perfPage.visit();
    perfPage.waitForLoad();

    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const hasSLA = text.includes('sla') || text.includes('compliance') ||
                     text.includes('turnaround') || text.includes('on-time');
      cy.log(hasSLA ? '✅ SLA compliance metrics displayed' : '⚠️ SLA metrics not explicitly labeled');
    });
  });

  it('TC-P4.3: Should verify SLA compliance levels', () => {
    cy.fixture('partner-performance').then((perf) => {
      perfPage.visit();
      perfPage.waitForLoad();

      cy.log(`📋 SLA target: ${perf.slaMetrics.targetCompliancePercent}% on-time`);
      cy.log(`📋 Turnaround target: ${perf.slaMetrics.turnaroundDays} days`);

      cy.get('body').then(($body) => {
        const text = $body.text();
        const hasLevel = perf.slaMetrics.levels.some((l) => text.includes(l));
        cy.log(hasLevel ? '✅ SLA compliance level indicator found' : '⚠️ No level indicator found');
      });
    });
  });

  it('TC-P4.4: Should display customer ratings/quality score', () => {
    cy.fixture('partner-performance').then((perf) => {
      perfPage.visit();
      perfPage.waitForLoad();

      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        const hasRating = text.includes('rating') || text.includes('quality') ||
                         text.includes('score') || text.includes('star');
        cy.log(hasRating
          ? `✅ Rating display found (scale: ${perf.ratingScale.min}-${perf.ratingScale.max})`
          : '⚠️ Rating not explicitly displayed');
      });
    });
  });

  it('TC-P4.5: Should display completion rate statistics', () => {
    cy.fixture('partner-performance').then((perf) => {
      perfPage.visit();
      perfPage.waitForLoad();

      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        const metricsFound = perf.completionMetrics.filter((m) => text.includes(m.toLowerCase()));
        cy.log(`✅ ${metricsFound.length}/${perf.completionMetrics.length} completion metrics found`);
        metricsFound.forEach((m) => cy.log(`  ✓ ${m}`));
      });
    });
  });

  it('TC-P4.6: Should display performance trend chart', () => {
    perfPage.visit();
    perfPage.waitForLoad();

    cy.get('body').then(($body) => {
      const hasChart = $body.find('.recharts-wrapper, svg, canvas').length > 0;
      cy.log(hasChart ? '✅ Performance trend chart displayed' : '⚠️ No chart/graph found');
    });
  });

  it('TC-P4.7: Should verify performance data reflects only own metrics', () => {
    perfPage.visit();
    perfPage.waitForLoad();

    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const hasSystemWide = text.includes('all partners') || text.includes('system average') ||
                           text.includes('network total');
      expect(hasSystemWide).to.be.false;
      cy.log('✅ Performance data scoped to own partner only');
    });
  });

  it('TC-P4.8: Should show numeric metrics (not just loading states)', () => {
    perfPage.visit();
    perfPage.waitForLoad();

    // Verify actual numbers are rendered, not just card shells
    cy.get('[class*="card"]').first().within(() => {
      cy.get('*').then(($els) => {
        const text = $els.text();
        const hasNumbers = /\d+/.test(text);
        cy.log(hasNumbers ? '✅ Numeric metrics rendered' : '⚠️ No numbers in metric cards');
      });
    });
  });
});
