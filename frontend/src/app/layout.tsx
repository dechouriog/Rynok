import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WalletProvider } from '@/context/WalletContext';
import { ToastProvider } from '@/components/ui/Toast';
import { OnboardingModal } from '@/components/OnboardingModal';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Rynok · Bienes raíces en cripto con escrow', template: '%s · Rynok' },
  description:
    'Publica, explora y compra propiedades en ETH. Cada compra queda protegida por un smart contract de escrow en Ethereum.',
  applicationName: 'Rynok',
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'Rynok',
    title: 'Rynok · Bienes raíces en cripto con escrow',
    description: 'Compra y vende propiedades en ETH con el pago protegido por un smart contract.',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#1d4ed8',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex min-h-dvh flex-col font-sans text-ink antialiased">
        <a
          href="#contenido"
          className="sr-only z-50 rounded-control bg-brand-600 px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Saltar al contenido
        </a>
        <ToastProvider>
          <WalletProvider>
            <Navbar />
            <main id="contenido" className="flex-1">
              {children}
            </main>
            <Footer />
            <OnboardingModal />
          </WalletProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
