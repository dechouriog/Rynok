import './globals.css';
import { Navbar } from '@/src/components/Navbar';
import { WalletProvider } from '@/src/WalletProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <WalletProvider>
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}

