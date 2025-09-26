import { test, expect } from '@playwright/test';

const COMPANY_NAME = 'Playwright Test Company';

test.describe('Companies management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Empresas' }).click();
    await expect(page.getByRole('heading', { name: 'Empresas Cadastradas' })).toBeVisible();
  });

  test('allows creating a new company from the drawer form', async ({ page }) => {
    await page.getByTestId('add-company-button').click();

    await expect(page.getByRole('heading', { name: 'Nova Empresa' })).toBeVisible();

    await page.getByLabel('Nome da Empresa *').fill(COMPANY_NAME);
    await page.getByLabel('Tipo de Negócio *').fill('Tecnologia');
    await page.getByLabel('Número de Lojas *').fill('5');
    await page.getByLabel('Valor Total Mensal (R$) *').fill('12345');
    await page.getByLabel('Status *').selectOption('ativo');
    await page.getByLabel('Nome *').fill('Joana Testadora');
    await page.getByLabel('Telefone *').fill('11988887777');
    await page.getByLabel('Email do Responsável *').fill('joana@example.com');

    await page.getByRole('button', { name: 'Salvar Empresa' }).click();

    const successToast = page
      .getByTestId('toast-message')
      .filter({ hasText: `Empresa ${COMPANY_NAME} cadastrada com sucesso.` });
    await expect(successToast).toBeVisible();

    await expect(page.getByRole('row', { name: new RegExp(COMPANY_NAME) })).toBeVisible();
  });

  test('shows feedback when editing and deleting companies', async ({ page }) => {
    const editTarget = 'ANIMALE';
    const deleteTarget = 'AREZZO';

    await page.getByRole('button', { name: `Editar empresa ${editTarget}` }).click();
    await expect(
      page
        .getByTestId('toast-message')
        .filter({ hasText: `Empresa ${editTarget} atualizada com sucesso.` })
    ).toBeVisible();

    await page.getByRole('button', { name: `Excluir empresa ${deleteTarget}` }).click();
    await expect(
      page
        .getByTestId('toast-message')
        .filter({ hasText: `Empresa ${deleteTarget} excluída.` })
    ).toBeVisible();
  });
});
