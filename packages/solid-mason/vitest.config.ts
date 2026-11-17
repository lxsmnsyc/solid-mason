import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import solid from '@solidjs/vite-plugin';

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
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});
