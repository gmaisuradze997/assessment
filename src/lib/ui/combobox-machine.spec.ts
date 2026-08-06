import { describe, expect, it } from 'vitest';
import { ComboboxMachine, type ComboboxOption } from './combobox-machine';

const OPTIONS: ComboboxOption[] = [
	{ value: 'alice', label: 'Alice' },
	{ value: 'bob', label: 'Bob' },
	{ value: 'carol', label: 'Carol', disabled: true },
	{ value: 'dave', label: 'Dave' }
];

function machine(initial?: ConstructorParameters<typeof ComboboxMachine>[1]) {
	return new ComboboxMachine({ options: OPTIONS }, initial);
}

describe('ComboboxMachine', () => {
	it('filters options by case-insensitive substring', () => {
		const m = machine();
		m.dispatch({ type: 'input', query: 'a' });
		expect(m.filtered.map((o) => o.value)).toEqual(['alice', 'carol', 'dave']);
		expect(m.open).toBe(true);
	});

	it('moves active index with wrap-around, skipping disabled options', () => {
		const m = machine();
		m.dispatch({ type: 'open' });
		// First enabled is Alice (index 0).
		expect(m.activeIndex).toBe(0);

		m.dispatch({ type: 'move', delta: 1 }); // Bob
		expect(m.activeOption?.value).toBe('bob');

		m.dispatch({ type: 'move', delta: 1 }); // skip Carol → Dave
		expect(m.activeOption?.value).toBe('dave');

		m.dispatch({ type: 'move', delta: 1 }); // wrap to Alice
		expect(m.activeOption?.value).toBe('alice');

		m.dispatch({ type: 'move', delta: -1 }); // wrap back to Dave
		expect(m.activeOption?.value).toBe('dave');
	});

	it('Home and End jump to first/last enabled option', () => {
		const m = machine();
		m.dispatch({ type: 'end' });
		expect(m.activeOption?.value).toBe('dave');
		m.dispatch({ type: 'home' });
		expect(m.activeOption?.value).toBe('alice');
	});

	it('selectActive commits the active option and closes', () => {
		const m = machine();
		m.dispatch({ type: 'open' });
		m.dispatch({ type: 'move', delta: 1 });
		m.dispatch({ type: 'selectActive' });
		expect(m.value).toBe('bob');
		expect(m.query).toBe('Bob');
		expect(m.open).toBe(false);
		expect(m.activeIndex).toBe(-1);
	});

	it('refuses to select a disabled option', () => {
		const m = machine();
		m.dispatch({ type: 'select', value: 'carol' });
		expect(m.value).toBeNull();
	});

	it('Escape closes first, then clears the value', () => {
		const m = machine({ value: 'alice' });
		expect(m.query).toBe('Alice');

		m.dispatch({ type: 'open' });
		m.dispatch({ type: 'escape' });
		expect(m.open).toBe(false);
		expect(m.value).toBe('alice');
		expect(m.query).toBe('Alice');

		m.dispatch({ type: 'escape' });
		expect(m.value).toBeNull();
		expect(m.query).toBe('');
	});

	it('resyncs activeIndex when the filter shrinks past it', () => {
		const m = machine();
		m.dispatch({ type: 'open' });
		m.dispatch({ type: 'end' });
		expect(m.activeIndex).toBe(3); // Dave in unfiltered list

		m.dispatch({ type: 'input', query: 'ali' });
		// Filter collapses to Alice only; activeIndex resets to first enabled.
		expect(m.filtered.map((o) => o.value)).toEqual(['alice']);
		expect(m.activeIndex).toBe(0);
	});

	it('ArrowDown opens when closed and focuses the selected value', () => {
		const m = machine({ value: 'dave' });
		const handled = m.handleKeydown({ key: 'ArrowDown', altKey: false });
		expect(handled).toBe(true);
		expect(m.open).toBe(true);
		expect(m.activeOption?.value).toBe('dave');
	});

	it('Alt+ArrowDown opens without moving the active option', () => {
		const m = machine();
		m.handleKeydown({ key: 'ArrowDown', altKey: true });
		expect(m.open).toBe(true);
		expect(m.activeIndex).toBe(0);
	});

	it('setOptions drops a value that is no longer present', () => {
		const m = machine({ value: 'bob' });
		m.setOptions([
			{ value: 'alice', label: 'Alice' },
			{ value: 'dave', label: 'Dave' }
		]);
		expect(m.value).toBeNull();
	});
});
