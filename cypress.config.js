const { defineConfig } = require('cypress');
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    specPattern: 'tests/e2e/**/*.cy.{js,ts}',
    supportFile: 'tests/support/e2e.js',
    fixturesFolder: 'tests/fixtures',

    // Viewport
    viewportWidth: 1280,
    viewportHeight: 720,

    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 30000,
    taskTimeout: 60000,

    // Retries
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // Media — video only on failure (handled via afterSpec)
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'tests/results/screenshots',
    videosFolder: 'tests/results/videos',

    // Reporter
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
      configFile: 'tests/reporter-config.json',
    },

    // Environment
    env: {
      SUPABASE_URL: 'https://dkjbjmfeyjmrgxjvangj.supabase.co',
      API_URL: 'https://dkjbjmfeyjmrgxjvangj.supabase.co/rest/v1',
      ENVIRONMENT: 'staging',
      LOG_LEVEL: 'info', // debug | info | warn | error
      RETRY_DELAY: 1000,
    },

    // Experimental
    experimentalRunAllSpecs: true,

    setupNodeEvents(on, config) {
      // ── Delete videos for passing specs (keep only failures) ──
      on('after:spec', (spec, results) => {
        if (results && results.video) {
          const hasFailures = results.tests?.some(
            (t) => t.attempts?.some((a) => a.state === 'failed')
          );
          if (!hasFailures) {
            fs.unlinkSync(results.video);
          }
        }
      });

      // ── Merge any cypress.env.json overrides ──
      const envFile = path.resolve(__dirname, 'cypress.env.json');
      if (fs.existsSync(envFile)) {
        const envOverrides = JSON.parse(fs.readFileSync(envFile, 'utf-8'));
        config.env = { ...config.env, ...envOverrides };
      }

      // ── Task helpers for Node-side operations ──
      on('task', {
        log(message) {
          console.log(`  📋 ${message}`);
          return null;
        },
        table(data) {
          console.table(data);
          return null;
        },
        readFileMaybe(filename) {
          if (fs.existsSync(filename)) {
            return fs.readFileSync(filename, 'utf-8');
          }
          return null;
        },
        writeFile({ path: filePath, content }) {
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
          fs.writeFileSync(filePath, content);
          return null;
        },
      });

      return config;
    },
  },
});
