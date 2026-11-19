import { test, expect, installMetaMask, connectFromNavbar } from './fixtures';
import type { Browser, Page } from '@playwright/test';

async function asUser(browser: Browser, account: 'seller' | 'buyer', viewport?: { width: number; height: number }) {
  const context = await browser.newContext(viewport ? { viewport } : {});
  await installMetaMask(context, { account });
  const page = await context.newPage();
  return { context, page };
}

async function publish(page: Page, title: string, price: string) {
  await page.goto('/properties/new');
  await page.getByRole('main').getByRole('button', { name: 'Conectar wallet' }).click();
  await page.getByLabel(/Título/).fill(title);
  await page
    .getByLabel(/Descripción/)
    .fill('Propiedad creada por la prueba e2e con descripción suficientemente larga.');
  await page.getByLabel(/Ubicación/).fill('Medellín, Antioquia');
  await page.getByLabel(/Precio en ETH/).fill(price);
  await page.getByRole('button', { name: 'Publicar propiedad' }).click();
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  await expect(page.getByText('Propiedad publicada')).toBeVisible();
  return page.url();
}

async function enablePurchase(page: Page) {
  await page.getByRole('button', { name: 'Habilitar compra' }).click();
  await expect(page.getByText('Compra habilitada en el contrato')).toBeVisible({ timeout: 30_000 });
}

async function buy(page: Page, url: string, price: string) {
  await page.goto(url);
  await connectFromNavbar(page);
  await page.getByRole('button', { name: 'Comprar con MetaMask' }).click();
  const dialog = page.getByRole('dialog', { name: 'Confirmar compra protegida' });
  await expect(dialog.getByText(/30 días/)).toBeVisible();
  await dialog.getByRole('button', { name: new RegExp(`Depositar ${price}`) }).click();
  await page.waitForURL('**/escrow');
  await expect(page.getByText('Compra protegida en escrow')).toBeVisible();
}

test.describe('Flujo completo con escrow', () => {
  test('publicar → habilitar → comprar con otra wallet → confirmar entrega → vendida', async ({ browser }) => {
    const seller = await asUser(browser, 'seller');
    const title = `Casa e2e ${Date.now()}`;
    const url = await publish(seller.page, title, '1.25');
    await expect(seller.page.getByText('Disponible', { exact: true })).toBeVisible();
    await enablePurchase(seller.page);

    const buyer = await asUser(browser, 'buyer');
    await buy(buyer.page, url, '1,25');
    const card = buyer.page.getByTestId('transaction-card').filter({ hasText: title });
    await expect(card.getByText('Fondos en escrow')).toBeVisible();

    // La propiedad aparece reservada para todos
    await seller.page.reload();
    await expect(seller.page.getByText('En escrow', { exact: true })).toBeVisible();

    await card.getByRole('button', { name: 'Confirmar entrega' }).click();
    await buyer.page.getByRole('button', { name: 'Sí, liberar el pago' }).click();
    await expect(buyer.page.getByText('Entrega confirmada: el pago se liberó al vendedor')).toBeVisible({
      timeout: 30_000,
    });
    await expect(card.getByText('Completada')).toBeVisible();

    await buyer.page.goto(url);
    await expect(buyer.page.getByText('Vendida')).toBeVisible();
    await expect(buyer.page.getByText(/ya se vendió/)).toBeVisible();

    await seller.context.close();
    await buyer.context.close();
  });

  test('camino de reembolso: el vendedor reembolsa y la propiedad vuelve a estar disponible', async ({ browser }) => {
    const seller = await asUser(browser, 'seller');
    const title = `Casa reembolso ${Date.now()}`;
    const url = await publish(seller.page, title, '0.75');
    await enablePurchase(seller.page);

    const buyer = await asUser(browser, 'buyer');
    await buy(buyer.page, url, '0,75');

    await seller.page.goto('/escrow');
    await seller.page.getByRole('tab', { name: /Mis ventas/ }).click();
    const card = seller.page.getByTestId('transaction-card').filter({ hasText: title });
    await card.getByRole('button', { name: 'Reembolsar al comprador' }).click();
    await seller.page.getByRole('button', { name: 'Sí, devolver los fondos' }).click();
    await expect(seller.page.getByText('Venta cancelada: el comprador recibió su reembolso')).toBeVisible({
      timeout: 30_000,
    });
    await expect(card.getByText('Reembolsada')).toBeVisible();

    // El contrato deja la venta habilitada al mismo precio tras un reembolso: la propiedad vuelve a estar a la venta.
    await seller.page.goto(url);
    await expect(seller.page.getByText('Compra habilitada en el contrato')).toBeVisible();
    await expect(seller.page.getByText('Disponible', { exact: true })).toBeVisible();

    await seller.context.close();
    await buyer.context.close();
  });

  test('el comprador no ve el botón de compra hasta que el vendedor la habilita', async ({ browser }) => {
    const seller = await asUser(browser, 'seller');
    const url = await publish(seller.page, `Sin habilitar ${Date.now()}`, '2');
    const buyer = await asUser(browser, 'buyer');
    await buyer.page.goto(url);
    await expect(buyer.page.getByText(/aún no habilitó la compra/)).toBeVisible();
    await expect(buyer.page.getByRole('button', { name: 'Comprar con MetaMask' })).toHaveCount(0);
    await seller.context.close();
    await buyer.context.close();
  });
});
