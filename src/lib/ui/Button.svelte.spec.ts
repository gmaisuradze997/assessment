import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import Button from './Button.svelte';

function label(text: string) {
	return createRawSnippet(() => ({
		render: () => `<span>${text}</span>`
	}));
}

describe('Button', () => {
	it('renders a native button with type="button" by default', () => {
		render(Button, {
			props: {
				children: label('Save')
			}
		});

		const button = screen.getByRole('button', { name: 'Save' });
		expect(button.tagName).toBe('BUTTON');
		expect(button).toHaveAttribute('type', 'button');
		expect(button).toBeEnabled();
	});

	it('renders an anchor when href is provided', () => {
		render(Button, {
			props: {
				href: '/en/dashboard',
				children: label('Dashboard')
			}
		});

		const link = screen.getByRole('link', { name: 'Dashboard' });
		expect(link.tagName).toBe('A');
		expect(link).toHaveAttribute('href', '/en/dashboard');
	});

	it('shows a spinner and marks the control busy while loading', () => {
		const { container } = render(Button, {
			props: {
				loading: true,
				children: label('Saving')
			}
		});

		const button = screen.getByRole('button', { name: 'Saving' });
		expect(button).toHaveAttribute('aria-busy', 'true');
		expect(button).toBeDisabled();
		expect(container.querySelector('svg.animate-spin')).toBeTruthy();
	});

	it('disables interaction when disabled', () => {
		render(Button, {
			props: {
				disabled: true,
				children: label('Locked')
			}
		});

		expect(screen.getByRole('button', { name: 'Locked' })).toBeDisabled();
	});

	it('applies the danger tone classes on the solid variant', () => {
		render(Button, {
			props: {
				tone: 'danger',
				children: label('Delete')
			}
		});

		const button = screen.getByRole('button', { name: 'Delete' });
		expect(button.className).toContain('bg-danger');
		expect(button.className).toContain('text-white');
	});
});
