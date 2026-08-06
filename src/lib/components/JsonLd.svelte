<script lang="ts">
	const { data }: { data: Record<string, unknown> } = $props();

	// Assembled via concatenation: a literal closing script tag anywhere in
	// a .svelte file (even inside a string) terminates the script block.
	// '<' is escaped as \u003c (still valid JSON) so no serialized value
	// can ever close the script element early.
	const tag = $derived(
		'<scr' +
			'ipt type="application/ld+json">' +
			JSON.stringify(data).replace(/</g, '\\u003c') +
			'</scr' +
			'ipt>'
	);
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- JSON-LD with '<' escaped above -->
	{@html tag}
</svelte:head>
