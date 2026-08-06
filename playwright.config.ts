import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
// Prefer localhost over 127.0.0.1 — Vite preview binds the IPv6 loopback
// by default on some hosts, and 127.0.0.1 then never becomes ready.
const BASE_URL = `http://localhost:${PORT}`;

/**
 * E2E gates: axe accessibility + keyboard paths on the dashboard table.
 * Preview serves the production build so CI exercises the same HTML/CSS
 * users get — not the Vite dep-optimized dev graph.
 */
export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? 'github' : 'list',
	expect: {
		toHaveScreenshot: {
			animations: 'disabled',
			caret: 'hide',
			maxDiffPixelRatio: 0.02
		}
	},
	use: {
		baseURL: BASE_URL,
		trace: 'on-first-retry',
		...devices['Desktop Chrome']
	},
	webServer: {
		command: `SESSION_SECRET=${process.env.SESSION_SECRET ?? 'e2e-ci-only-secret'} npm run preview -- --host localhost --port ${PORT} --strictPort`,
		url: BASE_URL,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
