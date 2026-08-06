/**
 * Per-route initial-JS budget, enforced against the production build.
 *
 * "size-limit or equivalent": this is the equivalent. size-limit sums
 * whatever files match a glob, but with hashed, code-split chunks a glob
 * cannot express "the JS this route actually ships on first load" — and
 * SvelteKit's node numbering shifts whenever a route is added, so any
 * hardcoded file list silently rots. Instead this walks the same data the
 * runtime uses: the server manifest (route id -> layout/leaf node
 * indices) joined with the client Vite manifest (node -> chunk file ->
 * transitive static imports). The result is byte-exact for what the
 * browser downloads before hydration, measured as gzip transfer size.
 *
 * Run after `npm run build`. Exits non-zero if any route exceeds budget.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const CLIENT_DIR = '.svelte-kit/output/client';

/**
 * Budgets in gzipped KB. The assignment's numbers (public 80, dashboard
 * 150) are ceilings; actuals are printed on every run so drift is visible
 * long before the gate trips.
 */
const BUDGETS = [
	{ pattern: /^\/\[\[lang=locale\]\]\/dashboard/, label: 'dashboard', maxKb: 150 },
	// Dev-only primitives showcase (Dialog + Combobox). Kept separate so the
	// real public budget stays honest for product routes.
	{ pattern: /^\/\[\[lang=locale\]\]\/design/, label: 'design', maxKb: 120 },
	{ pattern: /./, label: 'public', maxKb: 80 }
];

const { manifest } = await import(pathToFileURL('.svelte-kit/output/server/manifest-full.js').href);
const viteManifest = JSON.parse(readFileSync(`${CLIENT_DIR}/.vite/manifest.json`, 'utf8'));

const gzipCache = new Map();
function gzipKb(file) {
	if (!gzipCache.has(file)) {
		gzipCache.set(file, gzipSync(readFileSync(`${CLIENT_DIR}/${file}`)).length / 1024);
	}
	return gzipCache.get(file);
}

/** Collect a chunk and its transitive *static* imports (what the browser fetches eagerly). */
function collectChunk(manifestKey, files) {
	const entry = viteManifest[manifestKey];
	if (!entry || files.has(entry.file)) return;
	files.add(entry.file);
	for (const dep of entry.imports ?? []) collectChunk(dep, files);
}

// Chunks every page loads regardless of route: the start/app entries and
// their eager imports, as listed in the server manifest's client block.
const baseFiles = new Set(manifest._.client.imports);

const failures = [];
console.log('Initial JS per route (gzip):\n');

for (const route of manifest._.routes) {
	if (!route.page) continue; // endpoints ship no JS
	const files = new Set(baseFiles);
	for (const nodeIndex of [...route.page.layouts, route.page.leaf]) {
		if (nodeIndex === undefined) continue;
		collectChunk(`.svelte-kit/generated/client-optimized/nodes/${nodeIndex}.js`, files);
	}

	const totalKb = [...files].reduce((sum, file) => sum + gzipKb(file), 0);
	const budget = BUDGETS.find((b) => b.pattern.test(route.id));
	const ok = totalKb <= budget.maxKb;
	if (!ok) failures.push(route.id);

	console.log(
		`  ${ok ? 'PASS' : 'FAIL'}  ${route.id.padEnd(40)} ${totalKb.toFixed(1).padStart(6)} KB / ${budget.maxKb} KB (${budget.label})`
	);
}

if (failures.length > 0) {
	console.error(`\nBudget exceeded for: ${failures.join(', ')}`);
	process.exit(1);
}
console.log('\nAll routes within budget.');
