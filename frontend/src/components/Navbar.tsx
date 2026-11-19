import { Logo } from './layout/Logo';
import { NavLinks } from './layout/NavLinks';
import { MobileMenu } from './layout/MobileMenu';
import { WalletBanner } from './layout/WalletBanner';
import { ConnectWalletButton } from './ConnectWalletButton';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />
        <NavLinks />
        <div className="flex items-center gap-2">
          <ConnectWalletButton />
          <MobileMenu />
        </div>
      </div>
      <WalletBanner />
    </header>
  );
}
