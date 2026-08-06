<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { enableViewTransitions } from '$lib/navigation/view-transitions';
	import { initObservability } from '$lib/observability/init';

	let { children } = $props();

	enableViewTransitions();

	onMount(() => {
		initObservability();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
