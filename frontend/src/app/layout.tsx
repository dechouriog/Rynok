import './globals.css';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WalletProvider } from '@/context/WalletContext';
import { OnboardingModal } from '@/components/OnboardingModal';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="font-sans text-slate-900 antialiased">
        <WalletProvider>
          <Navbar />

          <main>{children}</main>

          <Footer />

          <OnboardingModal />
        </WalletProvider>
      </body>
    </html>
  );
}