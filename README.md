# Product Slice — SvelteKit

A production-shaped slice of a product: an SEO-critical public surface (landing, blog, search, EN/DE) and an authenticated dashboard (login, streamed data table with inline editing), built on SvelteKit 2 + Svelte 5 (runes) + TypeScript + Tailwind v4, deployed on Vercel.

**Live:** https://sveltekit-product-slice.vercel.app (English: [/en](https://sveltekit-product-slice.vercel.app/en), German: [/de](https://sveltekit-product-slice.vercel.app/de))

## Quickstart

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest unit suite
npm run check      # svelte-check (strict TS)
npm run lint       # prettier + eslint
npm run perf       # build + JS bundle budget + Lighthouse CI gate
```

Demo accounts (password `demo1234` for all):

| Email              | Role   | Purpose                                                                 |
| ------------------ | ------ | ----------------------------------------------------------------------- |
| `admin@demo.test`  | admin  | full access                                                             |
| `editor@demo.test` | editor | can edit dashboard rows                                                 |
| `viewer@demo.test` | viewer | read-only — use it to see edits rejected with 403 + optimistic rollback |

## Rendering matrix

Every route made a deliberate choice; this is the map.

| Route                                                | Strategy                                | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/en`, `/de`                                         | **Prerendered**                         | Pure static marketing content. Zero server cost, best possible LCP, cacheable at the edge for every visitor. Bare `/` is prerendered as a 308 → `/en` (a real HTTP redirect on Vercel, not just the meta-refresh stub).                                                                                                                                                                                                                                                                                     |
| `/sitemap.xml`, `/robots.txt`, `/blog/[slug]/og.png` | **Prerendered**                         | The URL space (static routes + repo-versioned posts) is fully known at build, so all SEO artifacts — locale-aware sitemap, robots pointing at the deployment's absolute sitemap URL, per-post/per-locale OG images — are written once during prerender and served as static files.                                                                                                                                                                                                                          |
| `/blog`                                              | **ISR** (300 s, `allowQuery: ['page']`) | Numbered pagination via `?page=` — crawlable and shareable (infinite scroll hides content from bots and breaks back-button scroll position). Can't prerender because pagination is a query string, but every rendered page is identical for all visitors — so ISR caches one variant per page number and repeat hits are CDN hits. `allowQuery` whitelists `page` so junk params can't fragment the cache. With a live CMS the same config grows a `bypassToken` for webhook-driven on-demand revalidation. |
| `/blog/[slug]`                                       | **Prerendered (`prerender = 'auto'`)**  | Content is build-time static, so per-request SSR would be waste. `'auto'` (not `true`) so unknown slugs still reach `load` at runtime and get the designed 404 instead of a platform-level miss.                                                                                                                                                                                                                                                                                                            |
| `/search`                                            | **SSR**                                 | Results depend on `?q=&tag=&sort=&page=`. The URL is the single source of truth — every filter state is shareable and back/forward replays exactly.                                                                                                                                                                                                                                                                                                                                                         |
| `/login`, `/logout`                                  | **SSR + form actions**                  | Progressive enhancement: the login form works without JavaScript.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `/dashboard`                                         | **SSR (awaited)**                       | The aggregates are cheap; streaming here would add a skeleton flash for no benefit.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `/dashboard/items`                                   | **Streamed SSR**                        | The shell (heading, filter bar, column headers) renders immediately; `rows` and `stats` are returned as un-awaited promises from `load` and stream in behind a skeleton.                                                                                                                                                                                                                                                                                                                                    |
| unknown URLs                                         | **Designed 404**                        | A catch-all route throws `error(404)` so the localized error page renders inside the normal layout.                                                                                                                                                                                                                                                                                                                                                                                                         |

## Runtime boundaries

| Route                                      | Runtime                                                                     | Why it lives there                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/search`                                  | **Edge** (Vercel Edge Functions)                                            | The one route where per-request SSR is unavoidable (unbounded query space — nothing cacheable) _and_ nothing anchors it to a region. It's read-only, its "database" is JSON bundled into the function (data locality is a non-issue: the data ships with the code, no origin round-trip), and its only dependency is zod — pure JS. TTFB is therefore purely proximity + cold start, and edge isolates win both: ~ms V8 isolate startup vs. a Node lambda cold start, running physically near the visitor.                                                                                        |
| `/dashboard/*`                             | **Node** (`nodejs22.x`, pinned explicitly in `dashboard/+layout.server.ts`) | This is where writes live — the update action mutates the in-memory overlay that stands in for a database. A warm single-region Node instance sees its own writes on the next read; spread across dozens of regional edge isolates, edits would appear and vanish depending on which isolate answered. It's also the seam where a real DB slots in, and DB drivers want Node: TCP sockets, connection pooling, and proximity to the data (data gravity). Behind auth, the proximity win of edge is negligible anyway — latency here is dominated by the (simulated) backend, not the network hop. |
| `/blog`, `/login`, everything else dynamic | **Node** (default)                                                          | ISR is serverless-only on Vercel, so `/blog` must be Node. `/login` issues cookies via form actions and shares the auth code path with the dashboard. No latency argument justifies splitting these out.                                                                                                                                                                                                                                                                                                                                                                                          |

The enabling change: sessions are HMAC-verified in `hooks.server.ts`, which runs inside **every** function — so the session code (`src/lib/server/session.ts`) uses **Web Crypto** (`crypto.subtle`), the common subset of both runtimes, instead of `node:crypto`. Otherwise the hook would have pinned every route to Node. (`subtle.verify` keeps the constant-time comparison.)

Known edge-runtime caveat: Vercel has deprecated standalone Edge Functions in favor of fluid compute; the config still works, and on Cloudflare/Netlify the same boundary would be expressed with their per-route runtime config instead.

## Architecture decisions

### Data layer (`src/lib/server/data/`)

- The mock JSON is imported directly and **parsed once with Zod at module init** (`db.ts`) — bad data fails the boot loudly instead of surfacing as `undefined` mid-page. An HTTP mock API around a flat file would add latency and failure modes without exercising any additional skill; the query layer is where the work is.
- `queryItems()` treats the 220 rows as a real API: server-side pagination, sorting (stable, with an id tie-break so pages never duplicate rows), and multi-facet filtering. Facet counts are computed with the _other_ facet's filters applied — standard faceted-search behavior, so the count next to each option is what selecting it would return.
- Edits go to an **in-memory overlay Map** (id → patch) on top of the immutable seed — the exact seam where a database would slot in. Known trade-off: on serverless, the overlay lives per warm instance and resets on cold starts. Acceptable for mock data; documented rather than hidden.
- URL query parsing (`src/lib/schemas/items-query.ts`) degrades every invalid value to its default (`.catch()`) instead of throwing — a hand-mangled URL renders the closest sensible view, never a 400. Out-of-range pages clamp to the last page. Serialization omits defaults so URLs stay canonical.

### Auth

- **Stateless HMAC-signed cookie** (`userId.expiry.signature`, secret from `SESSION_SECRET`). Chosen over an in-memory session store because the deploy target is serverless — cold starts would wipe sessions. Trade-off: no server-side revocation before expiry. Cookie is HttpOnly, Secure, SameSite=Lax; verification is constant-time.
- The **guard lives in `hooks.server.ts`**, not a layout load: layout loads don't re-run for every child navigation and can be bypassed by direct endpoint hits. The hook covers pages, form actions, and any future API routes under `/dashboard`.
- Login validates with **one Zod schema on both sides**: the client parses before submit (fast feedback), the server action parses again (the real boundary). Error messages are i18n keys resolved at render time.
- Authorization ≠ authentication: `viewer` sessions are valid but the update action rejects them with 403 — which doubles as the deterministic failure path for optimistic-UI rollback.
- `?redirectTo=` only accepts same-origin paths (no `//`), preventing open redirects.

### i18n

- **URL-based locale**: every page URL carries a locale segment (`/en/blog`, `/de/blog`) via an optional `[[lang=locale]]` param; bare paths (`/blog`) 308-redirect to the default locale in the locale layout, so each page still has exactly one canonical URL. `hreflang` alternates (both locales + `x-default`) + per-locale canonical on public pages; `<html lang>` set per request in the handle hook.
- **Intl end to end**: dates and numbers go through `Intl.DateTimeFormat` / `Intl.NumberFormat` (`src/lib/i18n/format.ts`) with per-locale BCP 47 tags — post dates, dashboard currency/percent/counts — never string templates.
- The provided dictionaries (`mocks/i18n.*.json`) are untouched; app-specific strings live in a typed overlay (`src/lib/i18n/messages.ts`) merged over them. `MessageKey` is derived from the merged dictionary, so a typo in a `t()` call is a **type error**.
- Hand-rolled `t()` (~40 lines including interpolation) instead of a library — at this string count a dependency isn't justified, and the swap is mechanical if it becomes one.

### Theming (`src/routes/layout.css`)

- **Semantic tokens, not parallel class lists.** Components only ever name a role — `bg-surface`, `text-foreground-muted`, `border-border-strong` — never a palette shade. Each token carries _both_ theme values in a single `light-dark()` declaration and is published to Tailwind with `@theme inline`, so there is no dark-mode copy of the token list and **not one `dark:` variant in the codebase**. Adding a role is one line; re-theming the product is editing one file.
- **`color-scheme` is the switch.** Which half of every `light-dark()` resolves is decided by the inherited `color-scheme` — which also themes native UI for free: select popups, scrollbars, the number spinners in the budget editor, the caret. So the OS preference is honoured with **zero JavaScript and zero server involvement**, which is the constraint that decided the design: `/en` and the posts are prerendered and `/blog` is ISR-cached, so their HTML is byte-identical for every visitor and can't carry a per-user theme class. A cookie read in the handle hook would have fragmented the CDN cache for exactly the pages that matter most for LCP.
- An explicit override is one class on `<html>` (`theme-light`/`theme-dark`), applied from `localStorage` by a ~10-line blocking script in `app.html` before first paint — no flash, and Svelte never touches it, so hydration can't disagree. Trade-off: the toggle is JS-only and hides itself via `<noscript>`; without JS you still get your OS preference, just not an override.
- Brand color is split by role, which is what keeps dark mode legible without per-component overrides: `primary*` are solid fills (identical in both themes — indigo-600 carries white text at 6.3:1 and clears 3:1 on either background), while `accent*` is the brand color drawn _on_ a surface (links, focus borders, active sort column) and lightens in dark, where indigo-600 text would sit at 3.1:1 against zinc-950.
- Long-form content follows the same tokens — the typography plugin's `--tw-prose-*` variables are mapped to them, so no `prose-invert` and no second prose theme. Code blocks are deliberately left dark in both themes.
- Lightning CSS (already in Tailwind's pipeline) downlevels `light-dark()` to a `color-scheme`-driven variable switch on its own, so browser support reaches back well past Safari 17.5 without a fallback in source. The one thing that breaks under that polyfill is nesting a themed token inside `color-mix()` — i.e. opacity modifiers like `bg-surface/60`, which is why none are used.

### SEO

- **Per-route head** via one `Seo` component (`src/lib/components/Seo.svelte`): `<title>`, meta description (localized per route), per-locale canonical, `hreflang` cluster, Open Graph (`og:locale` in territory form `en_US`/`de_DE` + `og:locale:alternate`), and Twitter cards (`summary_large_image` when the page has a social image).
- **JSON-LD** through a small `JsonLd` component (escapes `<` as `\u003c` so content can never close the script element early): `Organization` on the home page, `Article` + `BreadcrumbList` (localized crumb names and URLs) on every blog post.
- **`sitemap.xml`** (`src/routes/sitemap.xml/+server.ts`) is prerendered at build: one `<url>` per locale variant of every indexable page, each carrying the full `xhtml:link` hreflang cluster — mirroring the tags in the pages' heads. Post entries carry `<lastmod>`. Login and the auth-gated dashboard are excluded.
- **`robots.txt`** is a prerendered route rather than a static file so the `Sitemap:` line can carry the deployment's absolute origin (`PUBLIC_SITE_URL`). It stays allow-all: the dashboard is auth-gated and the handle hook 303-redirects anonymous crawlers to login, so a `Disallow` would add nothing — and it would fail Lighthouse's is-crawlable audit on the authenticated LHCI run.
- **OG images** (`/{lang}/blog/{slug}/og.png`, 1200×630) are rendered with **satori + resvg and prerendered at build time** rather than served from an edge function. The call: post content is repo-versioned and the slug set is closed, so every image is knowable at build — prerendering makes them plain CDN files with zero runtime latency for link-preview crawlers, no cold starts, and satori/resvg never enter the server bundle. An edge function only earns its keep when the input space is open (user content, unknown at build); that's the moment the route flips to `prerender = 'auto'` and rendering moves to request time. Images are localized (title, excerpt, `Intl`-formatted date) and carry the post's cover color.

### Dashboard table

- **Streaming + optimistic UI**: the streamed `rows` promise is copied into local state once resolved. Rendering from local state (instead of `{#await}`) is what makes optimistic edits possible — a cell updates instantly, and on failure the snapshot is restored and a toast explains why. Success applies the server-returned row (server truth wins).
- `rows` and `stats` are **independent promises**, so partial failure is a designed state: the summary strip can fail while the table renders, and vice versa. Inject failures with `?chaos=stats` or `?chaos=rows` on `/dashboard/items`.
- Sorting is real `<a>` links, filtering is a GET form — the table works with JavaScript disabled; JS makes it instant (debounced search input, auto-submitting facets).
- An artificial ~600–800 ms latency is simulated in `src/lib/server/delay.ts` (kept in production on purpose) — without it the in-process "API" resolves in microseconds and none of the streaming/skeleton/optimistic behavior would be observable.

## Performance budgets (enforced, not measured)

CI fails the build on any breach — `.github/workflows/ci.yml` runs both gates on every push/PR. Run locally with `npm run perf` (build + both gates).

**Lighthouse gate** (`lighthouserc.cjs`, `npm run perf:lhci`) — Lighthouse mobile defaults (Moto G Power emulation, 4× CPU slowdown, simulated slow 4G), 3 runs per URL, asserting the median so one noisy trace can't flake the gate. Audited URLs: `/en`, `/en/blog/sub-second-lcp-on-a-content-site`, `/en/dashboard/items` — the dashboard is auth-gated, so the config mints a valid session cookie (same HMAC scheme as the app, shared `SESSION_SECRET`) and sends it via `extraHeaders`; no puppeteer login script needed.

| Budget                             | Threshold | Measured (median)                           |
| ---------------------------------- | --------- | ------------------------------------------- |
| LCP                                | < 2000 ms | `/` 1.52 s · blog 1.52 s · dashboard 1.81 s |
| CLS                                | < 0.1     | `/` 0.00 · blog 0.00 · dashboard 0.05       |
| TBT (lab proxy for INP < 200 ms)   | < 200 ms  | 0 ms everywhere                             |
| Perf / A11y / SEO / Best Practices | ≥ 95 each | 99–100 everywhere                           |

INP note: INP is a field metric — it needs real user interactions, which a lab navigation run doesn't have. Total Blocking Time is the standard lab stand-in (long main-thread tasks are what push INP over budget), so the 200 ms INP budget is enforced as TBT ≤ 200 ms. With ~0 ms TBT and event handlers that do constant-time state patches, field INP has enormous headroom.

The dashboard's 1.81 s LCP is dominated by the _deliberate_ ~800 ms simulated backend latency plus mobile CPU throttling — the streamed shell renders long before that. Two fixes were needed to pass the gate, both real bugs it caught: the stats skeleton was ~8 px shorter than the resolved cards (three rows of growth on the mobile 2-column grid → CLS 0.11), and the dashboard shipped a `robots: noindex` plus no meta description (SEO 54). The `noindex` was dead code — the auth hook 303-redirects every anonymous request, crawlers included, so the page is unreachable for indexing either way.

**JS bundle gate** (`scripts/bundle-budget.mjs`, `npm run perf:size`) — per-route **initial** JS, gzip: public surface ≤ 80 KB, dashboard ≤ 150 KB (the assignment's ceilings; actuals are printed on every run so drift is visible long before the gate trips). Currently the worst public route is `/search` at 62 KB (it ships zod for client-side validation) and the dashboard tops out at 66 KB.

Why a manifest walker instead of `size-limit`: size-limit sums whatever files match a glob, but with hashed, code-split chunks a glob can't express "the JS this route actually ships on first load" — and SvelteKit's node numbering shifts whenever a route is added, so a hardcoded file list silently rots. The script joins the server manifest (route → layout/leaf nodes) with the client Vite manifest (node → chunk → transitive static imports), which is byte-exact for what the browser downloads before hydration and covers **every** route automatically, including future ones.

## Failure-state tour

| State                            | How to see it                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Loading skeleton                 | Open `/dashboard/items` — the shell renders instantly, rows stream in.                                                    |
| Empty                            | Filter to something impossible, e.g. `?q=zzz` — designed empty state with a clear-filters CTA.                            |
| Row load error                   | `/dashboard/items?chaos=rows` — error panel with retry; the stats strip still renders.                                    |
| Partial failure                  | `/dashboard/items?chaos=stats` — stats strip fails, table unaffected.                                                     |
| Optimistic rollback (authz)      | Log in as `viewer@demo.test`, edit any budget/status — instant update, then rollback + toast when the server returns 403. |
| Optimistic rollback (validation) | Edit a budget to a value above 10,000,000 (server rejects; the client pre-check catches negatives/NaN before submit).     |
| Custom 404                       | Any unknown URL, or an unknown blog slug like `/blog/nope`.                                                               |

## Mock-data usage notes

Per `mocks/README.md`:

- `users.json` and post `id`/`slug` fields are untouched.
- No mock files were modified. Additional UI strings (EN + DE) were added in code (`src/lib/i18n/messages.ts`) rather than by editing the shipped dictionaries.
- Markdown post bodies are rendered server-side with `marked`; the content is trusted repo data, so no sanitizer pass is applied (documented trade-off — a real CMS feed would get one).

## Deploy

Vercel with `@sveltejs/adapter-vercel` (streamed SSR requires it; static assets and prerendered pages are served from the CDN).

Environment variables:

| Variable          | Where                               | Purpose                                                                                                        |
| ----------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_SITE_URL` | build-time                          | Absolute origin for canonical/hreflang/OG URLs. Committed `.env` holds the localhost default.                  |
| `SESSION_SECRET`  | runtime, **required in production** | HMAC key for session cookies. Generate with `openssl rand -base64 32`. Dev falls back to an insecure constant. |

## Nice-to-haves shipped

### Feature flag (SSR, no flicker)

`betaInsights` is resolved in `hooks.server.ts` from an HttpOnly `ff` cookie into `locals.flags`, then exposed only under `/dashboard` via the dashboard layout load. The gated panel is in the SSR HTML — there is no client default that gets overwritten after hydration. The dashboard toggle is a form action (`?/flags`) that writes the cookie and 303-redirects to GET so loads re-run with the new value (a soft nav to `?ff=` that redirects back to the same URL would keep stale client page data). `?ff=betaInsights` / `?ff=-betaInsights` still works for full document loads / bookmarks. Flags are never read on prerendered/ISR pages (same cacheability constraint as theme).

### View Transitions API

`enableViewTransitions()` wraps client navigations in `document.startViewTransition` (skipped for `prefers-reduced-motion` and unsupported browsers). Named transitions keep the site header and dashboard chrome in place; blog card titles share `view-transition-name: post-title-{slug}` with the article `<h1>` so list → post morphs the title instead of a decorative fade.

### Service worker / offline dashboard shell

`src/service-worker.ts` precaches build/static/prerendered assets (including `/en/offline` and `/de/offline`). Dashboard navigations are network-first and cache successful HTML; offline revisits serve the last shell, or the locale offline page when nothing is cached. Public marketing pages stay CDN/prerender-served — the worker only special-cases the dashboard.

## Known trade-offs (recap)

- Edits persist per warm serverless instance only (in-memory overlay; the seam for a real DB).
- Signed cookies can't be revoked server-side before expiry (no session store by design).
- Summary stats can be up to one navigation stale after an inline edit (invalidation would re-stream the whole table for marginal benefit).
- Demo passwords are plaintext in `users.json` per the assignment; verification still happens server-side only.
- Overriding the theme needs JavaScript (following the OS preference does not) — the price of keeping the public pages cacheable byte-for-byte.
