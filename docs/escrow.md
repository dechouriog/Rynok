# Escrow — diseño, flujo y limitaciones

Contrato: [`contracts/contracts/Escrow.sol`](../contracts/contracts/Escrow.sol) ·
Tests: [`contracts/test/Escrow.test.ts`](../contracts/test/Escrow.test.ts) (`npx hardhat test`)

Desplegado en Sepolia:
[`0x049BBA8708b71E33f649Bae0E2F127F805ca9Ca9`](https://sepolia.etherscan.io/address/0x049BBA8708b71E33f649Bae0E2F127F805ca9Ca9)

## Flujo

| Paso | Quién | Dónde | Qué pasa |
| --- | --- | --- | --- |
| 1. Publicar | Vendedor | Backend | Igual que antes: solo se guarda en la base de datos, no se firma nada. |
| 2. Habilitar compra | Vendedor | Botón *Habilitar compra* en el detalle de su propiedad | Firma `list(propertyId, price)`: fija en el contrato el precio exacto en wei. |
| 3. Comprar | Comprador | Botón *Comprar con MetaMask* (solo aparece si el listado on-chain existe y su precio coincide con el publicado) | `deposit(propertyId, seller)` con `msg.value == price`. El backend verifica el evento `Deposited` y marca la propiedad `IN_ESCROW`. |
| 4a. Confirmar entrega | Comprador | */escrow* → *Confirmar entrega* | `confirmDelivery`: los fondos van al vendedor y la propiedad pasa a `SOLD`. |
| 4b. Reembolsar | Vendedor | */escrow* → *Reembolsar al comprador* | `refund`: los fondos vuelven al comprador y la propiedad vuelve a `AVAILABLE`. |
| 4c. Reclamar por plazo | Comprador | */escrow* → *Reclamar reembolso* (pasados 30 días) | `claimRefund`: si el vendedor no entregó en `DELIVERY_PERIOD` (30 días), el comprador recupera sus fondos. |

`propertyId` en el contrato es `keccak256(UUID)`, el mismo UUID de la base de datos.

## Decisiones de seguridad

**Listados y depósitos se indexan por `(propertyId, vendedor)`.** El contrato no puede saber
quién es el dueño real de una propiedad de la base de datos. Si los listados se indexaran solo por
`propertyId`, un atacante podría llamar `list` antes que el dueño y quedarse como vendedor. Con la
clave compuesta, cada dirección solo puede listar, y por lo tanto bloquear, sus propias ventas:

- Un atacante que lista la propiedad a 1 wei y la "compra" con otra cuenta solo crea un depósito
  asociado a su propia dirección. El listado del vendedor real queda intacto y el comprador
  legítimo compra sin problema (test *"un atacante con listado y depósito de 1 wei propios no
  bloquea la venta real"*).
- El frontend siempre deposita para el vendedor que el backend tiene registrado como dueño, y el
  backend rechaza registrar depósitos cuyo evento on-chain no coincida con ese vendedor y ese precio.

**El precio lo exige el contrato.** `deposit` revierte si `msg.value` es distinto del precio listado.

**Verificación on-chain en el backend.** Con `ESCROW_RPC_URL` configurado, el backend lee el recibo
de cada transacción reportada por el frontend y exige el evento correcto (`Deposited`, `Released` o
`Refunded`), con la propiedad, el vendedor, el comprador y el monto esperados. Sin esa variable, el
backend confía en el hash que envía el cliente, lo cual solo es aceptable en desarrollo.

**Plazo de entrega.** `DELIVERY_PERIOD = 30 days`, contado desde el depósito. Antes de vencer, solo
el vendedor puede devolver los fondos y solo el comprador puede liberarlos. Después de vencer, el
comprador puede además recuperarlos sin depender del vendedor.

## Limitaciones conocidas

- **Precio desincronizado.** Si el vendedor edita el precio en Rynok, el listado on-chain queda con
  el precio anterior. El botón *Comprar* se oculta hasta que el vendedor pulse *Actualizar precio
  on-chain*. El precio no se puede cambiar con un depósito pendiente: ni el backend ni el contrato
  lo permiten.
- **Plazo calculado por dos relojes.** El contrato usa el timestamp del bloque del depósito. El
  backend usa la fecha en que registró el depósito para aceptar que el comprador registre el
  reclamo. Ambos difieren en segundos, y además el contrato es quien custodia los fondos.
- **Sin disputas.** Si comprador y vendedor no están de acuerdo, el contrato no tiene árbitro: el
  resultado depende de que el comprador confirme, de que el vendedor reembolse o de que venza el
  plazo.

## Trabajo futuro

- **Sistema de disputas** con un árbitro o multisig que pueda decidir el destino de los fondos de
  un depósito en conflicto. Queda fuera del alcance del MVP.
- Plazo de entrega configurable por propiedad.
- Indexar los eventos del contrato en el backend, en lugar de depender de que el frontend reporte
  cada transacción.
