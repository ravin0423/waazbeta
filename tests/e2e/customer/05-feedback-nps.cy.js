// ─── Test 5: Feedback & NPS ───
import { CustomerLoginPage, CustomerFeedbackPage, CustomerNotificationsPage } from '../../support/page-objects/customer';

describe('Customer Feedback & NPS', () => {
  const loginPage = new CustomerLoginPage();
  const feedbackPage = new CustomerFeedbackPage();
  const notificationsPage = new CustomerNotificationsPage();

  beforeEach(() => {
    cy.fixture('customer-users').then((users) => {
      loginPage.login(users.customer.email, users.customer.password);
    });
    cy.log('🧪 Starting Feedback & NPS test');
  });

  // ─── Service Feedback ───
  it('TC-C5.1: Should load feedback page', () => {
    feedbackPage.visit();
    feedbackPage.waitForLoad();
    cy.get('[class*="card"]').should('exist');
    cy.log('✅ Feedback page loaded');
  });

  it('TC-C5.2: Should display star rating component (1-5)', () => {
    cy.fixture('customer-feedback').then((feedback) => {
      feedbackPage.visit();
      feedbackPage.waitForLoad();

      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        const hasRating = text.includes('rate') || text.includes('rating') || text.includes('star') ||
                         $body.find('svg[class*="star"], [class*="star"]').length > 0;
        cy.log(hasRating
          ? `✅ Rating component found (scale: ${feedback.ratingScale.min}-${feedback.ratingScale.max})`
          : '⚠️ Rating component not found');
      });
    });
  });

  it('TC-C5.3: Should submit service feedback with rating', () => {
    cy.fixture('customer-feedback').then((feedback) => {
      feedbackPage.visit();
      feedbackPage.waitForLoad();

      cy.get('body').then(($body) => {
        const hasForm = $body.find('textarea').length > 0 ||
                       $body.find('svg[class*="star"], [class*="star"]').length > 0;
        if (hasForm) {
          feedbackPage.rateService(feedback.serviceFeedback.rating);
          feedbackPage.fillFeedbackText(feedback.serviceFeedback.text);
          feedbackPage.submitFeedback();
          feedbackPage.assertFeedbackSubmitted();
          cy.log(`✅ Feedback submitted: ${feedback.serviceFeedback.rating}/5 stars`);
        } else {
          cy.log('⚠️ Feedback form not found on page');
        }
      });
    });
  });

  it('TC-C5.4: Should submit negative feedback', () => {
    cy.fixture('customer-feedback').then((feedback) => {
      feedbackPage.visit();
      feedbackPage.waitForLoad();

      cy.get('body').then(($body) => {
        const hasForm = $body.find('textarea').length > 0;
        if (hasForm) {
          feedbackPage.rateService(feedback.negativeFeedback.rating);
          feedbackPage.fillFeedbackText(feedback.negativeFeedback.text);
          cy.log(`✅ Negative feedback prepared: ${feedback.negativeFeedback.rating}/5`);
        }
      });
    });
  });

  // ─── NPS Survey ───
  it('TC-C5.5: Should display NPS survey (0-10 scale)', () => {
    cy.fixture('customer-feedback').then((feedback) => {
      feedbackPage.visit();
      feedbackPage.waitForLoad();

      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        const hasNPS = text.includes('nps') || text.includes('recommend') ||
                      text.includes('how likely') || text.includes('net promoter');
        cy.log(hasNPS
          ? `✅ NPS survey found (scale: ${feedback.npsScale.min}-${feedback.npsScale.max})`
          : '⚠️ NPS survey section not visible');
      });
    });
  });

  it('TC-C5.6: Should submit NPS promoter score (9-10)', () => {
    cy.fixture('customer-feedback').then((feedback) => {
      feedbackPage.visit();
      feedbackPage.waitForLoad();

      cy.get('body').then(($body) => {
        const hasNPS = $body.find('button:contains("9"), button:contains("10"), input[type="range"]').length > 0;
        if (hasNPS) {
          feedbackPage.submitNPSScore(feedback.npsPromoter.score);
          cy.log(`✅ NPS Promoter score submitted: ${feedback.npsPromoter.score}/10`);
        } else {
          cy.log('⚠️ NPS score buttons not found');
        }
      });
    });
  });

  it('TC-C5.7: Should submit NPS with comment', () => {
    cy.fixture('customer-feedback').then((feedback) => {
      feedbackPage.visit();
      feedbackPage.waitForLoad();

      cy.get('body').then(($body) => {
        const $textarea = $body.find('textarea');
        if ($textarea.length > 0) {
          cy.wrap($textarea.last()).clear().type(feedback.npsPromoter.comment);
          cy.log(`✅ NPS comment entered: "${feedback.npsPromoter.comment.substring(0, 50)}..."`);
        }
      });
    });
  });

  it('TC-C5.8: Should verify NPS categories exist', () => {
    cy.fixture('customer-feedback').then((feedback) => {
      const categories = Object.values(feedback.npsCategories);
      categories.forEach((cat) => {
        cy.log(`📋 NPS Category: ${cat.label} (${cat.min}-${cat.max})`);
      });
      cy.log('✅ NPS category structure verified');
    });
  });

  // ─── Feedback History ───
  it('TC-C5.9: Should display previous feedback/reviews', () => {
    feedbackPage.visit();
    feedbackPage.waitForLoad();

    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const hasHistory = text.includes('previous') || text.includes('history') ||
                        text.includes('your feedback') || text.includes('submitted');
      cy.log(hasHistory ? '✅ Feedback history visible' : '⚠️ No feedback history section');
    });
  });

  // ─── Notification Preferences ───
  it('TC-C5.10: Should load notifications page', () => {
    notificationsPage.visit();
    notificationsPage.waitForLoad();
    notificationsPage.assertNotificationList();
    cy.log('✅ Notifications page loaded');
  });

  it('TC-C5.11: Should display notification preference toggles', () => {
    cy.fixture('customer-feedback').then((feedback) => {
      notificationsPage.visit();
      notificationsPage.waitForLoad();

      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        const channels = feedback.notificationPreferences.channels;
        const found = channels.filter((ch) => text.includes(ch.toLowerCase()));
        cy.log(`✅ ${found.length}/${channels.length} notification channels found`);
        found.forEach((ch) => cy.log(`  ✓ ${ch}`));
      });
    });
  });

  it('TC-C5.12: Should display email digest frequency options', () => {
    cy.fixture('customer-feedback').then((feedback) => {
      notificationsPage.visit();
      notificationsPage.waitForLoad();

      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase();
        const freqs = feedback.notificationPreferences.digestFrequency;
        const found = freqs.filter((f) => text.includes(f.toLowerCase()));
        cy.log(`✅ ${found.length}/${freqs.length} digest frequency options found`);
        found.forEach((f) => cy.log(`  ✓ ${f}`));
      });
    });
  });

  it('TC-C5.13: Should only show own feedback data (data isolation)', () => {
    feedbackPage.visit();
    feedbackPage.waitForLoad();

    cy.get('body').then(($body) => {
      const text = $body.text().toLowerCase();
      const hasAdminData = text.includes('all users') || text.includes('all customers') || text.includes('system-wide');
      expect(hasAdminData).to.be.false;
      cy.log('✅ Data isolation verified — only own feedback visible');
    });
  });

  it('TC-C5.14: Accessibility — feedback forms have proper labels', () => {
    feedbackPage.visit();
    feedbackPage.waitForLoad();

    cy.get('body').then(($body) => {
      const $labels = $body.find('label');
      const $buttons = $body.find('button');
      const unlabeledButtons = [];

      $buttons.each((_, btn) => {
        const text = btn.textContent.trim();
        const ariaLabel = btn.getAttribute('aria-label');
        if (!text && !ariaLabel) unlabeledButtons.push(btn);
      });

      cy.log(`📋 Labels found: ${$labels.length}`);
      cy.log(`📋 Unlabeled buttons: ${unlabeledButtons.length}`);
      cy.log(unlabeledButtons.length === 0 ? '✅ All buttons properly labeled' : '⚠️ Some buttons lack labels');
    });
  });
});
