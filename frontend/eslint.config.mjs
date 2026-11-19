import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Los logs de depuración no llegan a producción; los errores reales van por la UI o console.error.
      'no-console': ['error', { allow: ['error'] }],
    },
  },
  globalIgnores([
    '.next/**',
    '.next-e2e/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
  ]),
]);

export default eslintConfig;
