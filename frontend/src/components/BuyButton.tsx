export function BuyButton() {
  return (
    <button
      disabled
      className="mt-6 w-full cursor-not-allowed rounded-lg bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-400"
      title="Disponible en una próxima entrega (escrow en Solidity)"
    >
      Comprar con MetaMask (próximamente)
    </button>
  );
}
