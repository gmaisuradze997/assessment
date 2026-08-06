/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, prerendered, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `campaignly-shell-${version}`;
const ASSETS = new Set([...build, ...files, ...prerendered]);

function isDashboardPath(pathname: string): boolean {
	return /\/(en|de)\/dashboard(\/|$)/.test(pathname);
}

function offlineFallbackPath(pathname: string): string {
	const match = pathname.match(/^\/(en|de)(\/|$)/);
	const locale = match?.[1] ?? 'en';
	return `/${locale}/offline`;
}

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll([...ASSETS]))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then(async (keys) => {
			for (const key of keys) {
				if (key !== CACHE) await caches.delete(key);
			}
			await sw.clients.claim();
		})
	);
});

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return;

	// Precached build / static / prerendered: cache-first.
	if (ASSETS.has(url.pathname)) {
		event.respondWith(cacheFirst(request));
		return;
	}

	// Dashboard HTML: network-first, cache successful responses for offline.
	if (request.mode === 'navigate' && isDashboardPath(url.pathname)) {
		event.respondWith(networkFirstDashboard(request));
	}
});

async function cacheFirst(request: Request): Promise<Response> {
	const cached = await caches.match(request);
	if (cached) return cached;
	const response = await fetch(request);
	if (response.ok) {
		const cache = await caches.open(CACHE);
		cache.put(request, response.clone());
	}
	return response;
}

async function networkFirstDashboard(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE);
	try {
		const response = await fetch(request);
		if (response.ok) {
			cache.put(request, response.clone());
		}
		return response;
	} catch {
		const cached = await cache.match(request);
		if (cached) return cached;

		const offlinePath = offlineFallbackPath(new URL(request.url).pathname);
		const offline = (await cache.match(offlinePath)) ?? (await caches.match(offlinePath)) ?? null;
		if (offline) return offline;

		return new Response('Offline', {
			status: 503,
			statusText: 'Service Unavailable',
			headers: { 'Content-Type': 'text/plain; charset=utf-8' }
		});
	}
}
