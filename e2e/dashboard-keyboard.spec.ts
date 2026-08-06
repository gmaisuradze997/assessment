import { expect, test } from '@playwright/test';
import { mintSessionCookie } from './helpers/session';

test.describe('dashboard table — keyboard', () => {
	test.beforeEach(async ({ context }) => {
		await context.addCookies([
			{
				name: 'session',
				value: mintSessionCookie('demo_editor').replace(/^session=/, ''),
				url: 'http://localhost:4173'
			}
		]);
	});

	test('sort, filter, paginate, and edit without a mouse', async ({ page }) => {
		await page.goto('/en/dashboard/items');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

		// --- Sort (column header link) ---
		const nameSort = page.getByRole('columnheader', { name: /name/i }).getByRole('link');
		await nameSort.focus();
		await expect(nameSort).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/sort=name/);
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

		// --- Filter (status facet checkbox via keyboard) ---
		// Checkboxes live inside a closed <details> popover — open it first.
		const statusFilter = page
			.locator('details')
			.filter({ has: page.getByText('Status', { exact: true }) })
			.first();
		const statusSummary = statusFilter.locator('summary');
		await statusSummary.focus();
		await expect(statusSummary).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(statusFilter).toHaveAttribute('open', '');

		const activeFilter = page.getByRole('checkbox', { name: /active/i }).first();
		await activeFilter.focus();
		await expect(activeFilter).toBeFocused();
		await page.keyboard.press('Space');
		await expect(page).toHaveURL(/status=active/);
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

		// --- Paginate ---
		const next = page.getByRole('link', { name: 'Next' });
		if (await next.isVisible()) {
			await next.focus();
			await expect(next).toBeFocused();
			await page.keyboard.press('Enter');
			await expect(page).toHaveURL(/page=2/);
			await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
		}

		// --- Edit (open dialog, change budget, save via keyboard) ---
		await page.goto('/en/dashboard/items');
		await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

		const editButton = page.locator('table tbody tr').first().getByRole('button');
		await editButton.focus();
		await expect(editButton).toBeFocused();
		await page.keyboard.press('Enter');

		const dialog = page.getByRole('dialog');
		await expect(dialog).toBeVisible();

		const budget = dialog.locator('input[name="budget"]');
		await budget.focus();
		await expect(budget).toBeFocused();
		// Must respect step="100" or native constraint validation blocks submit.
		const current = Number(await budget.inputValue());
		const nextBudget = String(current === 10_000 ? 20_000 : 10_000);
		await budget.fill(nextBudget);

		const save = dialog.getByRole('button', { name: 'Save' });
		await expect(save).toBeEnabled({ timeout: 5_000 });
		await save.focus();
		await expect(save).toBeFocused();
		await page.keyboard.press('Enter');

		await expect(dialog).toBeHidden({ timeout: 15_000 });
		await expect(page.getByText('Saved.')).toBeVisible();
	});
});
