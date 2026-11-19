import { defineConfig } from 'vitest/config';

export const coverage = {
  provider: 'v8' as const,
  include: ['src/**/*.ts'],
  // main.ts y seed.ts son puntos de entrada (seed.ts se prueba en parte desde hardening.spec.ts).
  exclude: ['src/main.ts', 'src/**/*.spec.ts'],
  reporter: ['text', 'text-summary', 'json-summary', 'html'],
};

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts'],
    coverage,
  },
});
