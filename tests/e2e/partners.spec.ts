import { test, expect } from '@playwright/test';

const PARTNER_NAME = 'SP Águas Express';

test.describe('Partners management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Parceiros' }).click();
    await expect(page.getByRole('heading', { name: 'Parceiros Distribuidores' })).toBeVisible();
  });

  test('allows deleting a partner after confirmation and shows feedback', async ({ page }) => {
    page.once('dialog', (dialog) => {
      expect(dialog.message()).toContain(PARTNER_NAME);
      dialog.accept();
    });

    await page.getByRole('button', { name: `Excluir parceiro ${PARTNER_NAME}` }).click();

    await expect(
      page
        .getByTestId('toast-message')
        .filter({ hasText: `Parceiro ${PARTNER_NAME} excluído.` })
    ).toBeVisible();
  });
});
