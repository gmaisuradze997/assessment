import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export type ThemeClass = 'theme-light' | 'theme-dark';

/**
 * Force an explicit theme override (same classes `app.html` applies) and
 * wait until the page shell background has flipped — Lightning CSS's
 * `light-dark()` polyfill resolves asynchronously relative to the class
 * toggle under parallel load. Chromium may report backgrounds as `oklch()`.
 */
export async function setTheme(page: Page, theme: ThemeClass) {
	const mode = theme === 'theme-dark' ? 'dark' : 'light';
	await page.emulateMedia({ colorScheme: mode });
	await page.evaluate((cls) => {
		document.documentElement.classList.remove('theme-light', 'theme-dark');
		document.documentElement.classList.add(cls);
		document.documentElement.dataset.theme = cls === 'theme-light' ? 'light' : 'dark';
	}, theme);

	await page.waitForFunction((isDark) => {
		if (!document.documentElement.classList.contains(isDark ? 'theme-dark' : 'theme-light')) {
			return false;
		}

		const meanChannel = (cssColor: string): number | null => {
			const oklch = cssColor.match(/oklch\(\s*([0-9.]+)/i);
			if (oklch) {
				const lightness = Number(oklch[1]);
				// oklch lightness is 0–1 (or occasionally 0–100); normalize to 0–255.
				return lightness <= 1 ? lightness * 255 : (lightness / 100) * 255;
			}
			const rgb = cssColor.match(/rgba?\(\s*(\d+)[\s,/]+(\d+)[\s,/]+(\d+)/i);
			if (!rgb) return null;
			return (Number(rgb[1]) + Number(rgb[2]) + Number(rgb[3])) / 3;
		};

		const shell = document.querySelector<HTMLElement>('.bg-background') ?? document.documentElement;
		const bgLuma = meanChannel(getComputedStyle(shell).backgroundColor);
		if (bgLuma === null) return false;
		const bgReady = isDark ? bgLuma < 80 : bgLuma > 220;
		if (!bgReady) return false;

		// Also wait for muted text tokens — under parallel load `light-dark()` can
		// flip the shell background before nav link colors catch up, which makes
		// axe report light-theme muted ink on a dark page.
		const muted =
			document.querySelector<HTMLElement>('nav a:not([aria-current])') ??
			document.querySelector<HTMLElement>('.text-foreground-muted');
		if (!muted) return true;
		const textLuma = meanChannel(getComputedStyle(muted).color);
		if (textLuma === null) return false;
		return isDark ? textLuma > 140 : textLuma < 140;
	}, mode === 'dark');
}

/**
 * Run axe and fail the test on any serious or critical violation.
 * Moderate/minor findings do not fail the gate — matching the
 * assignment's severity bar.
 */
export async function expectNoSeriousAxeViolations(page: Page, label: string) {
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
		.analyze();

	const blocking = results.violations.filter(
		(v) => v.impact === 'serious' || v.impact === 'critical'
	);

	expect(blocking, formatViolations(label, blocking)).toEqual([]);
}

function formatViolations(
	label: string,
	violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']
): string {
	if (violations.length === 0) return `${label}: no serious/critical axe violations`;
	return [
		`${label}: ${violations.length} serious/critical axe violation(s)`,
		...violations.map((v) => {
			const nodes = v.nodes
				.slice(0, 5)
				.map((n) => `    - ${n.target.join(' ')}: ${n.failureSummary ?? ''}`)
				.join('\n');
			return `  [${v.impact}] ${v.id}: ${v.help}\n${nodes}`;
		})
	].join('\n');
}
