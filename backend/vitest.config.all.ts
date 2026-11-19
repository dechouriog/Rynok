import { defineConfig } from 'vitest/config';
import { coverage } from './vitest.config.js';

/** Unitarias + e2e juntas, para medir la cobertura total del backend. */
export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    hookTimeout: 30_000,
    coverage: { ...coverage, thresholds: { lines: 80, statements: 80, functions: 75, branches: 70 } },
  },
});
