// Captura todas las pantallas de Rynok en 3 anchos (móvil, tablet, escritorio).
// Uso: node scripts/screenshots.mjs <carpeta-salida> [baseUrl] [apiUrl]
// Requiere frontend y backend corriendo. No modifica datos.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.argv[2] ?? 'docs/screenshots/after';
const base = process.argv[3] ?? 'http://localhost:3000';
const api = process.argv[4] ?? 'http://localhost:3001';

const WIDTHS = [
  { name: 'mobile', width: 360, height: 780 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 860 },
];

const res = await fetch(`${api}/properties`).catch(() => null);
const body = res && res.ok ? await res.json() : [];
const list = Array.isArray(body) ? body : (body.items ?? []);
const firstId = list[0]?.id;

const PAGES = [
  ['home', '/'],
  ['marketplace', '/properties'],
  ...(firstId
    ? [
        ['detalle', `/properties/${firstId}`],
        ['editar', `/properties/${firstId}/edit`],
      ]
    : []),
  ['publicar', '/properties/new'],
  ['dashboard', '/dashboard'],
  ['wallet', '/wallet'],
  ['escrow', '/escrow'],
  ['about', '/about'],
  ['404', '/ruta-que-no-existe'],
];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const problems = [];
for (const vp of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: 'reduce' });
  // La guía de bienvenida tapa la pantalla en la primera visita: se captura aparte.
  await ctx.addInitScript(() => {
    try {
      window.localStorage.setItem('rynok_onboarding_seen', 'true');
    } catch {
      // sin acceso a localStorage
    }
  });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && problems.push(`[${vp.name}] console: ${m.text()}`));
  for (const [name, path] of PAGES) {
    const response = await page.goto(base + path, { waitUntil: 'networkidle' }).catch((e) => {
      problems.push(`[${vp.name}] ${path}: ${e.message}`);
      return null;
    });
    const status = response?.status();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    if (overflow) problems.push(`[${vp.name}] ${path}: scroll horizontal`);
    await page.screenshot({ path: join(outDir, `${name}-${vp.name}.png`), fullPage: true });
    console.log(`${vp.name.padEnd(8)} ${String(status).padEnd(4)} ${path}`);
  }
  await ctx.close();
}
const first = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
const onboarding = await first.newPage();
await onboarding.goto(base + '/', { waitUntil: 'networkidle' });
await onboarding.screenshot({ path: join(outDir, 'onboarding-desktop.png') });
await first.close();
await browser.close();
if (problems.length) console.log('\nProblemas detectados:\n' + [...new Set(problems)].join('\n'));
