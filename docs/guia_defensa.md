# Guía de defensa

Léela **antes** de la defensa, con el código abierto. Cada respuesta apunta al archivo que la respalda. Complementa [escrow.md](./escrow.md), que explica el contrato en detalle.

## 1. El contrato (`contracts/contracts/Escrow.sol`)

**¿Cómo evitan que alguien bloquee una propiedad con 1 wei?**
El vendedor fija el precio con `list(propertyId, price)` y `deposit` exige `msg.value == listing.price`. Además, listados y depósitos se indexan por `(propertyId, vendedor)`. Un atacante que "lista" y "compra" a 1 wei solo crea un trato asociado a su propia dirección: el listado del dueño real queda intacto. Hay una prueba de este ataque en `contracts/test/Escrow.test.ts`.

**Si `deposit` recibe el vendedor como argumento, ¿el comprador puede pagarle a cualquiera?**
Solo a un vendedor que haya listado esa propiedad: el par `(id, vendedor)` debe tener un listado activo y el monto debe ser su precio. La UI siempre usa la wallet del dueño, y el backend rechaza el registro si el vendedor del evento no es el dueño en la base (`EscrowService.recordDeposit`).

**¿Por qué 30 días? ¿Qué pasa si el comprador nunca confirma?**
`DELIVERY_PERIOD = 30 days` es una constante pública: nadie, tampoco el equipo, puede cambiarla para retener fondos. Pasado el plazo, el comprador recupera el dinero con `claimRefund`. Antes de eso, el vendedor puede devolverlo con `refund`. No hay sistema de disputas: está documentado como trabajo futuro.

**¿Cómo previenen la reentrancy?**
`ReentrancyGuard` de OpenZeppelin en las funciones que transfieren ETH, y el estado cambia antes del `call` (checks-effects-interactions).

**¿Cómo se relaciona el UUID de la base con el contrato?**
`propertyId = uint256(keccak256(uuid))`. Está implementado igual en `backend/src/escrow/escrow-chain.verifier.ts` (`escrowPropertyId`) y en `frontend/src/lib/blockchain.ts`, con una prueba en cada lado.

## 2. Backend y coherencia de estados

**Si la transacción la manda el navegador, ¿qué impide que el cliente mienta?**
El backend lee el recibo con `ESCROW_RPC_URL` y exige que la transacción haya ido al contrato configurado, que haya tenido éxito y que emitiera el evento esperado con la propiedad, el comprador (la wallet del JWT), el vendedor (el dueño) y el monto (el precio) correctos (`EscrowChainVerifier.assertEvent`).

**¿Y si alguien despliega el backend sin `ESCROW_RPC_URL`?**
Antes de esta iteración se aceptaba cualquier hash sin verificar. Ahora, con `NODE_ENV=production`, el backend **rechaza** las operaciones (503) y `/health` muestra `"verification": "unavailable"`. En desarrollo sigue siendo opcional para poder probar sin nodo. Prueba: `backend/src/hardening.spec.ts`.

**¿Se puede registrar dos veces el mismo pago?**
No: `depositTxHash` es único y la API responde 409 (`hardening.e2e-spec.ts`).

**¿Qué pasa si el pago se hizo pero el backend estaba caído?**
El dinero ya está seguro en el contrato. La UI conserva el hash y ofrece "Reintentar registro", que no vuelve a cobrar (`frontend/src/components/BuyButton.tsx`, prueba en `escrow.test.tsx`).

**¿Cómo se mantienen coherentes los estados AVAILABLE, IN_ESCROW y SOLD?**
Solo cambian tras un evento verificado: `Deposited` lleva a `IN_ESCROW`, `Released` a `SOLD` y `Refunded` de vuelta a `AVAILABLE`. El listado on-chain no se guarda en la base: la web lo lee del contrato, así que no puede desincronizarse. Ver la tabla en [architecture.md](./architecture.md).

**¿Por qué `trust proxy`?**
Render pone un proxy delante. Sin `trust proxy`, todas las peticiones llegarían con la IP del proxy y el límite de 10 logins por minuto bloquearía a todos los usuarios a la vez.

**¿Por qué helmet con `Cross-Origin-Resource-Policy: cross-origin`?**
La web en Vercel muestra imágenes servidas por la API desde otro origen. La política por defecto de helmet (`same-origin`) las habría bloqueado.

## 3. Frontend, diseño y UX

**¿Por qué no se veía el azul de marca antes?**
Tailwind v4 no lee `tailwind.config.ts` sin `@config`, así que las clases `brand-*` no existían. Los tokens se movieron a `@theme` en `globals.css` ([style_guide.md](./style_guide.md)).

**¿Cuándo aparece el botón de compra?**
Solo si la propiedad está `AVAILABLE`, quien mira no es el dueño y el contrato confirma que el vendedor habilitó la venta **al precio publicado**. La lectura se hace por RPC, así que funciona aunque el visitante no tenga MetaMask (`PurchasePanel.tsx`).

**¿Qué pasa si el dueño cambia el precio?**
El listado on-chain queda con el precio anterior: la compra se bloquea ("El precio registrado en el contrato no coincide") y el dueño ve **Actualizar precio on-chain**.

**¿Qué pasa sin MetaMask, en otra red o con la sesión vencida?**

- Sin MetaMask, se ofrece un enlace de instalación.
- En otra red, aparece un banner con el botón "Cambiar a Sepolia" (y la red se agrega a MetaMask si no la conoce).
- Con la sesión vencida (401), se pide una firma nueva y se reintenta la operación (`withSession`).
- Si cambias de cuenta en MetaMask, se cierra la sesión anterior.

Todo esto está probado en `WalletContext.test.tsx`.

**¿Qué hicieron por la accesibilidad?**

- Contraste AA (el texto más claro tiene 4.8:1), foco visible y "Saltar al contenido".
- Etiquetas y errores enlazados con `aria-describedby`.
- Modales con `<dialog>` nativo y pestañas navegables con teclado.
- `prefers-reduced-motion` y `alt` en las imágenes.

Las pruebas buscan elementos por rol y etiqueta, así que si se rompe la accesibilidad también se rompen las pruebas.

## 4. Pruebas y CI

**¿Cómo prueban MetaMask?**

- En las unitarias, con un proveedor EIP-1193 falso respaldado por una wallet real de ethers: las firmas se verifican de verdad.
- En Playwright, `window.ethereum` delega en Node, que firma y envía transacciones reales a un nodo Hardhat con `Escrow.sol`, mientras el backend verifica on-chain (`e2e/fixtures.ts`, `e2e/stack.mjs`).

**¿Qué cobertura tienen?**
Contrato 100 %; backend 93 % con unitarias y e2e (81 % solo unitarias, medido ahora sobre todo `src/`); frontend 94 %. Detalle en [test_evidence.md](./test_evidence.md).

**¿Qué corre la CI?**
Lint, typecheck, pruebas de contrato, backend y frontend, build y Playwright con un servicio de Postgres (`.github/workflows/ci.yml`). **Ojo:** aún no se ha ejecutado en GitHub, así que no se puede afirmar que esté en verde hasta subir la rama.

## 5. Preguntas incómodas

- **"¿Esto lo hizo una IA?"** El uso de IA está declarado en [IA_Doc.md](./IA_Doc.md), incluida esta iteración, y los commits están marcados. Lo que se evalúa es que **ustedes** entiendan y defiendan cada decisión: repasen este documento con el código abierto.
- **"¿Por qué no hay árbitro?"** El MVP excluye las disputas, y un árbitro centralizado contradice la propuesta sin intermediarios. Queda como trabajo futuro (multisig 2-de-3 u oráculo).
- **"¿Qué pasa si se elimina una propiedad con la compra habilitada?"** El contrato no tiene `unlist`, así que el listado on-chain permanece. La API no registra pagos de propiedades eliminadas, y la UI lo advierte en la confirmación. Está documentado en [security.md](./security.md).
