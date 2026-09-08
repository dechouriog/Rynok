'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { connectWallet, getMe } from '@/lib/api';

type WalletState = {
  address: string | null;
  token: string | null;
  connect: () => Promise<void>;
  profile: { id: string; walletAddress: string; displayName?: string } | null;
  isConnecting: boolean;
  error: string | null;
};

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<WalletState['profile']>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('rynok_token');
    const savedAddress = sessionStorage.getItem('rynok_address');

    if (savedToken && savedAddress) {
      setToken(savedToken);
      setAddress(savedAddress);
    }
  }, []);

  useEffect(() => {
    if (token) {
      getMe(token)
        .then(setProfile)
        .catch(() => setProfile(null));
    }
  }, [token]);

  async function connect() {
    if (!(window as any).ethereum) {
      setError('MetaMask no está instalado.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const walletAddress = accounts[0];

      const signer = await provider.getSigner();
      const message = `Iniciar sesión en Rynok - ${Date.now()}`;
      const signature = await signer.signMessage(message);

      const { accessToken } = await connectWallet(
        walletAddress,
        signature,
        message
      );

      setAddress(walletAddress);
      setToken(accessToken);

      sessionStorage.setItem('rynok_token', accessToken);
      sessionStorage.setItem('rynok_address', walletAddress);
    } catch {
      setError('No se pudo conectar la wallet.');
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <WalletContext.Provider
      value={{
        address,
        token,
        connect,
        profile,
        isConnecting,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);

  if (!ctx) {
    throw new Error('useWallet debe usarse dentro de WalletProvider');
  }

  return ctx;
}

