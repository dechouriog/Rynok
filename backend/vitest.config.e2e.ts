import { defineConfig } from 'vitest/config';
import { coverage } from './vitest.config.js';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    hookTimeout: 30_000,
    coverage,
  },
});
