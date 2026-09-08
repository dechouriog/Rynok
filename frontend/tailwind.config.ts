import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rynok: {
          primary: '#0F172A',   // navy oscuro (botones, logo icon, texto fuerte)
          accent: '#2563EB',    // azul (nombre "Rynok", links activos)
          muted: '#64748B',     // gris de subtítulos
          surface: '#EEF2FF',   // fondo lavanda claro del hero
        },
      },
    },
  },
  plugins: [],
};
export default config;