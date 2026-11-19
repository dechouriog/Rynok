import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  test: {
    globals: true,
    clearMocks: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    env: {
      NEXT_PUBLIC_CHAIN_ID: '31337',
      NEXT_PUBLIC_ESCROW_ADDRESS: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      NEXT_PUBLIC_API_URL: 'http://api.test',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // Archivos generados, tipos, utilidades de prueba y la imagen OG (se genera en el build).
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/types/**',
        'src/lib/rynok-escrow.abi.ts',
        'src/app/opengraph-image.tsx',
      ],
      reporter: ['text', 'text-summary', 'json-summary', 'html'],
      thresholds: { lines: 70, statements: 70, functions: 65, branches: 60 },
    },
  },
});
