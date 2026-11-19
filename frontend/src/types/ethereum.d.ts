/** Proveedor EIP-1193 inyectado por MetaMask (o por el mock de las pruebas e2e). */
export type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
  isMetaMask?: boolean;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}
