import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Permite builds paralelos aislados (las pruebas e2e usan .next-e2e).
  distDir: process.env.NEXT_DIST_DIR || '.next',
  poweredByHeader: false,
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
};

export default nextConfig;
