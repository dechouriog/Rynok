export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-slate-900">
        Sobre Rynok
      </h1>

      <p className="mt-4 text-slate-600">
        Rynok es un marketplace inmobiliario descentralizado,
        desarrollado como proyecto académico. Permite publicar y
        explorar propiedades, y conectar tu wallet de MetaMask. La
        compra en ETH protegida por un smart contract de escrow llega
        en una próxima entrega.
      </p>

      <p className="mt-4">
        <a
          href="https://github.com/dechouriog/Rynok/blob/main/docs/user_guide.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 hover:underline"
        >
          Ver la guía de usuario completa →
        </a>
      </p>
    </div>
  );
}