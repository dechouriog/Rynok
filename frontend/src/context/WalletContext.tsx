'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { BrowserProvider } from 'ethers';
import { ApiError, connectWallet, getMe, requestLoginMessage, type User } from '@/lib/api';
import { CHAIN, describeTxError, getChainId, getEthereum, switchToExpectedChain } from '@/lib/blockchain';
import { sessionStore } from '@/lib/session-store';
import { useToast } from '@/components/ui/Toast';

export type WalletState = {
  /** Wallet con sesión iniciada en Rynok (en minúsculas). */
  address: string | null;
  token: string | null;
  profile: User | null;
  /** Red actual de MetaMask (null si no hay proveedor). */
  chainId: number | null;
  isWrongNetwork: boolean;
  hasProvider: boolean;
  isConnecting: boolean;
  error: string | null;
  /** Pide cuentas, firma el mensaje de login y abre sesión. Devuelve el token o null si falló. */
  connect: () => Promise<string | null>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  /** Ejecuta una llamada autenticada; si la sesión expiró (401), reconecta una vez y reintenta. */
  withSession: <T>(fn: (token: string) => Promise<T>) => Promise<T>;
};

const WalletContext = createContext<WalletState | null>(null);

const noopSubscribe = () => () => undefined;

export function WalletProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const session = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    sessionStore.getServerSnapshot,
  );
  const hasProvider = useSyncExternalStore(
    noopSubscribe,
    () => Boolean(getEthereum()),
    () => false,
  );
  const [profile, setProfile] = useState<User | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connecting = useRef<Promise<string | null> | null>(null);

  const token = session?.token ?? null;
  const address = session?.address ?? null;

  const disconnect = useCallback(() => {
    sessionStore.set(null);
    setProfile(null);
  }, []);

  // Perfil del usuario: si el token ya no es válido, la sesión se cierra en silencio.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getMe(token)
      .then((user) => !cancelled && setProfile(user))
      .catch((err: unknown) => {
        if (!cancelled && err instanceof ApiError && err.status === 401) disconnect();
      });
    return () => {
      cancelled = true;
    };
  }, [token, disconnect]);

  // Red y cuenta de MetaMask: se escuchan los cambios para mantener la interfaz coherente.
  useEffect(() => {
    const eth = getEthereum();
    if (!eth) return;
    let cancelled = false;
    getChainId(eth)
      .then((id) => !cancelled && setChainId(id))
      .catch(() => undefined);

    const onChain = (id: unknown) => setChainId(Number.parseInt(String(id), 16));
    const onAccounts = (accounts: unknown) => {
      const next = Array.isArray(accounts) ? String(accounts[0] ?? '').toLowerCase() : '';
      const current = sessionStore.getSnapshot();
      if (current && next !== current.address) {
        sessionStore.set(null);
        setProfile(null);
        toast({
          tone: 'info',
          title: 'Cambiaste de cuenta en MetaMask',
          description: 'Cerramos la sesión anterior. Conecta de nuevo para continuar con la nueva cuenta.',
        });
      }
    };
    eth.on?.('chainChanged', onChain);
    eth.on?.('accountsChanged', onAccounts);
    return () => {
      cancelled = true;
      eth.removeListener?.('chainChanged', onChain);
      eth.removeListener?.('accountsChanged', onAccounts);
    };
  }, [toast]);

  const connect = useCallback(async (): Promise<string | null> => {
    // Evita abrir dos firmas a la vez si varias acciones piden sesión simultáneamente.
    if (connecting.current) return connecting.current;
    const eth = getEthereum();
    if (!eth) {
      setError('MetaMask no está instalado. Instálalo desde metamask.io para continuar.');
      return null;
    }

    const run = (async () => {
      setIsConnecting(true);
      setError(null);
      try {
        const provider = new BrowserProvider(eth);
        const accounts = (await provider.send('eth_requestAccounts', [])) as string[];
        const walletAddress = accounts[0];
        const signer = await provider.getSigner(walletAddress);
        // Mensaje de un solo uso con nonce, emitido por el servidor (caduca a los 5 minutos).
        const message = await requestLoginMessage(walletAddress);
        const signature = await signer.signMessage(message);
        const { accessToken, user } = await connectWallet(walletAddress, signature, message);
        sessionStore.set({ token: accessToken, address: walletAddress.toLowerCase() });
        setProfile(user);
        setChainId(await getChainId(eth).catch(() => null));
        return accessToken;
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : describeTxError(err).startsWith('Rechazaste')
              ? 'Cancelaste la conexión en MetaMask.'
              : 'No se pudo conectar la wallet. Inténtalo de nuevo.';
        setError(message);
        return null;
      } finally {
        setIsConnecting(false);
        connecting.current = null;
      }
    })();
    connecting.current = run;
    return run;
  }, []);

  const switchNetwork = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) return;
    try {
      await switchToExpectedChain(eth);
      setChainId(await getChainId(eth));
    } catch (err) {
      toast({ tone: 'error', title: `No se pudo cambiar a ${CHAIN.name}`, description: describeTxError(err) });
    }
  }, [toast]);

  const withSession = useCallback(
    async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
      const current = sessionStore.getSnapshot()?.token ?? (await connect());
      if (!current) throw new ApiError(401, 'Conecta tu wallet para continuar.');
      try {
        return await fn(current);
      } catch (err) {
        if (!(err instanceof ApiError) || err.status !== 401) throw err;
        sessionStore.set(null);
        toast({ tone: 'info', title: 'Tu sesión expiró', description: 'Firma de nuevo en MetaMask para continuar.' });
        const renewed = await connect();
        if (!renewed) throw new ApiError(401, 'Tu sesión expiró. Conecta tu wallet de nuevo.');
        return fn(renewed);
      }
    },
    [connect, toast],
  );

  const value = useMemo<WalletState>(
    () => ({
      address,
      token,
      profile,
      chainId,
      isWrongNetwork: Boolean(address && chainId !== null && chainId !== CHAIN.id),
      hasProvider,
      isConnecting,
      error,
      connect,
      disconnect,
      switchNetwork,
      withSession,
    }),
    [
      address,
      token,
      profile,
      chainId,
      hasProvider,
      isConnecting,
      error,
      connect,
      disconnect,
      switchNetwork,
      withSession,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet debe usarse dentro de WalletProvider');
  return ctx;
}
