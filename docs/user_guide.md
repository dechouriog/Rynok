# Guía de usuario — Rynok

## 1. Configurar MetaMask

1. Instala la extensión de MetaMask en tu navegador (metamask.io).
2. Crea o importa una wallet.
3. Cambia a la red **Sepolia**. Si al comprar o vender MetaMask está en otra red,
   Rynok te pedirá cambiarla.
4. Consigue ETH de prueba en un faucet de Sepolia, por ejemplo el de Alchemy
   (alchemy.com/faucets/ethereum-sepolia). Lo necesitas para pagar el gas y, si
   vas a comprar, el precio de la propiedad.

## 2. Conectar tu wallet en Rynok

1. Haz clic en "Conectar wallet", en la esquina superior derecha.
2. Aprueba la conexión en la ventana de MetaMask.
3. Firma el mensaje que aparece. No cuesta gas: solo demuestra que la wallet es
   tuya. Cada mensaje sirve una sola vez y caduca a los 5 minutos.

> Si cambias de cuenta en MetaMask, Rynok cierra tu sesión. Vuelve a conectar con
> la nueva cuenta.

## 3. Vender una propiedad

1. Con tu wallet conectada, ve a "Publicar".
2. Completa título, descripción, ubicación y precio en ETH.
3. Opcionalmente, agrega una foto: haz clic en **"Subir una foto desde tu
   computador"** (JPG, PNG, WebP o GIF, de hasta 5 MB). Verás una vista previa
   antes de publicar.
4. Haz clic en "Confirmar y publicar". Publicar no cuesta gas.
5. Abre el detalle de tu propiedad y haz clic en **"Habilitar compra"**. MetaMask
   te pedirá firmar una transacción que fija el precio en el contrato de escrow.
   Mientras no lo hagas, nadie puede comprarla.
6. Si después editas el precio o la foto, vuelve al detalle y pulsa **"Actualizar precio
   on-chain"**. Hasta que lo hagas, el botón de compra queda oculto.

## 4. Comprar una propiedad

1. Ve a "Explorar" y abre la propiedad que te interese.
2. Haz clic en **"Comprar con MetaMask"** y confirma la transacción. Pagas
   exactamente el precio publicado, y los fondos quedan retenidos en el contrato
   de escrow; no van directamente al vendedor.
3. La propiedad pasa a estado "En escrow" y nadie más puede comprarla.

## 5. Cerrar la compra

En el menú, ve a **"Escrow"**. Ahí aparecen tus compras y ventas, con su estado
(fondos retenidos, completado o reembolsado) y las acciones disponibles:

| Quién | Botón | Qué pasa |
| --- | --- | --- |
| Comprador | **Confirmar entrega** | Los fondos se liberan al vendedor y la propiedad queda vendida. |
| Vendedor | **Reembolsar al comprador** | Los fondos vuelven al comprador y la propiedad vuelve a estar a la venta. |
| Comprador | **Reclamar reembolso** (aparece a los 30 días) | Si el vendedor no entregó en 30 días, recuperas tus fondos sin depender de él. |

Mientras haya fondos en escrow, el vendedor no puede editar ni eliminar la
propiedad.
