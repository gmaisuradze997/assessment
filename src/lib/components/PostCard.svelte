<script lang="ts">
	import type { PostCard } from '$lib/server/data/posts';
	import { currentLocale, t } from '$lib/i18n/runtime.svelte';
	import { localizePath } from '$lib/i18n/locales';
	import { formatDate } from '$lib/i18n/format';
	import Badge from '$lib/ui/Badge.svelte';
	import Card from '$lib/ui/Card.svelte';
	import Heading from '$lib/ui/Heading.svelte';
	import Text from '$lib/ui/Text.svelte';
	import { FOCUS_RING } from '$lib/ui/variants';

	interface Props {
		post: PostCard;
		/** Map of tag slug to localized label. */
		tagLabels: Record<string, string>;
	}

	const { post, tagLabels }: Props = $props();
	const locale = $derived(currentLocale());
</script>

<Card interactive padding="none" class="flex h-full flex-col">
	<a
		href={localizePath(`/blog/${post.slug}`, locale)}
		class="group flex h-full flex-col rounded-card {FOCUS_RING}"
	>
		<div class="h-2" style="background-color: {post.coverColor}"></div>
		<div class="flex flex-1 flex-col p-6">
			<div class="flex flex-wrap gap-1.5">
				{#each post.tags as tag (tag)}
					<Badge>{tagLabels[tag] ?? tag}</Badge>
				{/each}
			</div>
			<Heading
				level={2}
				size="md"
				class="post-title mt-3 group-hover:text-accent"
				style="view-transition-name: post-title-{post.slug}"
			>
				{post.title}
			</Heading>
			<Text size="sm" tone="muted" class="mt-2 line-clamp-3 flex-1 leading-relaxed">
				{post.excerpt}
			</Text>
			<div class="mt-4 flex items-center gap-3">
				<!-- Decorative swatch only — author name is the accessible label.
				     No glyph on the color chip: mock avatar hues aren't guaranteed
				     to clear AA against white/black text. -->
				<span
					class="h-8 w-8 shrink-0 rounded-pill"
					style="background-color: {post.author.avatarColor}"
					aria-hidden="true"
				></span>
				<div>
					<Text as="p" size="xs" tone="secondary" weight="medium">{post.author.name}</Text>
					<Text as="p" size="xs" tone="faint">
						{formatDate(locale, post.publishedAt)} · {t('blog.readingTime', {
							minutes: post.readingTimeMinutes
						})}
					</Text>
				</div>
			</div>
		</div>
	</a>
</Card>
