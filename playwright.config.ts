import { defineConfig, devices } from '@playwright/test';

/**
 * E2E de navegador contra el stack real (Postgres de prueba + Hardhat + RynokEscrow + API + Next.js),
 * levantado por e2e/stack.mjs. Requiere Postgres accesible (por defecto localhost:5433, usuario rynok)
 * y los contratos compilados (npm --prefix contracts run compile).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1, // comparten la misma blockchain y base de datos
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'es-CO',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node e2e/stack.mjs',
    url: 'http://localhost:3100',
    timeout: 420_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
  },
});
