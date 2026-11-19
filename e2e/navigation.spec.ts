import { test, expect, installMetaMask } from './fixtures';

test.describe('Navegación y estados de la wallet', () => {
  test('sin MetaMask ofrece instalarlo y las páginas de cuenta lo explican', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('banner').getByRole('link', { name: /MetaMask/ })).toHaveAttribute(
      'href',
      'https://metamask.io/download/',
    );
    await expect(page.getByRole('heading', { name: 'Conecta tu wallet para ver tu panel' })).toBeVisible();
  });

  test('en la red equivocada muestra el aviso y ofrece cambiar', async ({ browser }) => {
    const context = await browser.newContext();
    await installMetaMask(context, { account: 'buyer', chainId: 1 });
    const page = await context.newPage();
    await page.goto('/');
    await page.getByRole('banner').getByRole('button', { name: 'Conectar wallet' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'MetaMask está en otra red' })).toBeVisible();
    await context.close();
  });

  test('marketplace: filtros en la URL, 404 en español y menú móvil', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/properties');
    await page.getByLabel('Rango de precio').selectOption({ label: 'Más de 5 ETH' });
    await expect(page).toHaveURL(/minPrice=5/);

    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await page.getByRole('navigation', { name: 'Menú móvil' }).getByRole('link', { name: 'Cómo funciona' }).click();
    await expect(page.getByRole('heading', { name: 'Cómo funciona Rynok' })).toBeVisible();

    await page.goto('/properties/no-existe');
    await expect(page.getByRole('heading', { name: 'No encontramos esta página' })).toBeVisible();

    // Sin scroll horizontal a 360 px, incluso con fuentes anchas (Verdana en Windows, DejaVu Sans en Linux/CI).
    for (const path of ['/', '/properties', '/properties/no-existe', '/dashboard']) {
      await page.goto(path);
      await page.addStyleTag({ content: "*{font-family:Verdana,'DejaVu Sans',sans-serif !important}" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, `scroll horizontal en ${path}`).toBe(false);
    }
  });
});
