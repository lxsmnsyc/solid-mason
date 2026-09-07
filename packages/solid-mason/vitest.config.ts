import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import solid from 'vite-plugin-solid';

// The layout pass measures elements: `clientWidth`, computed padding,
// `offsetHeight`, and a forced reflow between writing a width and reading a
// height back. jsdom returns zero for all of it, so the suite runs in a real
// browser instead of asserting against a stub of the thing under test.
export default defineConfig({
  plugins: [solid()],
  resolve: {
    conditions: ['development', 'browser'],
  },
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
    // `vite-plugin-solid` forces `jsdom` on any config it sees under Vitest.
    // Browser mode supplies the DOM here, so the setting is overridden rather
    // than pulling in a DOM implementation the suite never uses.
    environment: 'node',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});
