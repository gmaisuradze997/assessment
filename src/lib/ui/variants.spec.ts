import { describe, expect, it } from 'vitest';
import { cx } from './cx';
import { variants } from './variants';

describe('cx', () => {
	it('joins truthy string parts with single spaces', () => {
		expect(cx('a', 'b', 'c')).toBe('a b c');
	});

	it('drops falsy parts', () => {
		expect(cx('a', false, null, undefined, '', 'b')).toBe('a b');
	});

	it('returns an empty string when everything is falsy', () => {
		expect(cx(false, null, undefined)).toBe('');
	});
});

describe('variants', () => {
	const button = variants({
		base: 'btn',
		variants: {
			tone: { primary: 'tone-primary', danger: 'tone-danger' },
			size: { sm: 'size-sm', md: 'size-md' }
		},
		defaults: { tone: 'primary', size: 'md' }
	});

	it('applies defaults when no props are given', () => {
		expect(button()).toBe('btn tone-primary size-md');
	});

	it('overrides a single default', () => {
		expect(button({ tone: 'danger' })).toBe('btn tone-danger size-md');
	});

	it('overrides multiple groups', () => {
		expect(button({ tone: 'danger', size: 'sm' })).toBe('btn tone-danger size-sm');
	});

	it('appends the caller class override last', () => {
		expect(button({ class: 'w-full' })).toBe('btn tone-primary size-md w-full');
	});

	it('skips a group when its value and default are both absent', () => {
		const bare = variants({
			base: 'x',
			variants: { state: { on: 'on', off: 'off' } }
		});
		expect(bare()).toBe('x');
		expect(bare({ state: 'on' })).toBe('x on');
	});
});
