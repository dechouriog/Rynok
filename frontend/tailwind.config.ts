import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: { colors: { rynok: { primary: '#1F2937', accent: '#22C55E' } } },
  },
  plugins: [],
};
export default config;