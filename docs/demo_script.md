# Guion de demo (5 minutos)

Hay dos formas de hacer la demo. **Recomendada: Sepolia**, con el contrato ya desplegado (`0x049BBA87…`). **Plan B: Hardhat local**, que no depende de faucets ni de la red.

## Preparación A: Sepolia (antes de entrar, unos 15 minutos)

1. Dos cuentas de MetaMask en **Sepolia** con ETH de prueba: vendedora y compradora. Faucet: alchemy.com/faucets/ethereum-sepolia.
2. Backend con `ESCROW_RPC_URL` (RPC de Sepolia) y `ESCROW_CONTRACT_ADDRESS=0x049BBA8708b71E33f649Bae0E2F127F805ca9Ca9`. Frontend con `NEXT_PUBLIC_CHAIN_ID=11155111` y la misma dirección.
3. Datos de ejemplo con precios pequeños: `DEMO_SELLER_ADDRESS=<wallet vendedora> DEMO_PRICE_SCALE=0.001 npm run seed`. Así las propiedades cuestan entre 0,0008 y 0,0094 ETH.
4. Si usas Render: abre la URL del backend 1 minuto antes (el plan gratuito se duerme) y comprueba `/health`, que debe mostrar `"verification": "on-chain"`.
5. Dos navegadores o perfiles, uno con cada cuenta. Pestaña aparte con Swagger (`/api/docs`).

## Preparación B: Hardhat local

1. `docker compose up -d postgres`
2. `npm run chain` (nodo en :8545). En otra terminal: `npm --prefix contracts run deploy:local` e imprime la dirección, que en un nodo nuevo es `0x5FbDB2315678afecb367f032d93F642f64180aa3`. Configúrala en `ESCROW_CONTRACT_ADDRESS` (backend, con `ESCROW_RPC_URL=http://127.0.0.1:8545`) y en `NEXT_PUBLIC_ESCROW_ADDRESS` (frontend, con `NEXT_PUBLIC_CHAIN_ID=31337`). Luego `npm run seed` y `npm run dev`.
3. En MetaMask: red `http://127.0.0.1:8545`, chainId 31337, y las cuentas públicas #0 y #1 de Hardhat.

> Plan C sin MetaMask: `npm run test:browser` recorre la compra completa y el reembolso en Chromium contra un stack real y deja el reporte. Puedes mostrarlo en pantalla.

## Guion

| Tiempo    | Qué haces                                                                                                                                  | Qué dices                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:30 | Home en escritorio: hero y "Cómo funciona". La primera vez aparece la guía de bienvenida.                                                  | "Rynok es un marketplace inmobiliario: pagas en ETH y el dinero queda en un contrato de escrow hasta que confirmas la entrega."                                                                         |
| 0:30–1:00 | `/properties`: filtra **Más de 5 ETH** (o el rango que aplique), ordena por precio y muestra la paginación. Achica a móvil y abre el menú. | "Filtros, orden y paginación en el servidor; responsive desde 360 px y accesible por teclado."                                                                                                          |
| 1:00–1:45 | **Vendedora**: Conectar wallet → firma. Publicar → título, precio y **foto subida** → Publicar.                                            | "El login es una firma de un mensaje con nonce de un solo uso que caduca en 5 minutos. La foto se valida por sus bytes, no por la extensión."                                                           |
| 1:45–2:15 | En el detalle: **Habilitar compra** → MetaMask `list` → "Compra habilitada en el contrato".                                                | "La venta queda registrada en el contrato por propiedad y vendedor: nadie puede listarla ni bloquearla en mi nombre."                                                                                   |
| 2:15–3:15 | **Compradora**: misma propiedad → Conectar → **Comprar con MetaMask** → modal (monto y 30 días) → Depositar → `/escrow`.                   | "El botón solo aparece si el contrato confirma el precio publicado. El backend no confía en el navegador: lee el evento `Deposited` y compara comprador, vendedor y monto antes de marcarla En escrow." |
| 3:15–3:35 | Vendedora recarga el detalle → **En escrow**. En su `/escrow` → pestaña Ventas.                                                            | "El estado es coherente entre contrato, base de datos e interfaz."                                                                                                                                      |
| 3:35–4:05 | Compradora: **Confirmar entrega** → doble confirmación → "Completada". El detalle muestra **Vendida**. Abre el hash en Etherscan.          | "El pago se libera al vendedor solo cuando el comprador confirma. Todo es verificable en Etherscan."                                                                                                    |
| 4:05–4:35 | Reembolso: con otra propiedad, la compradora deposita y la vendedora pulsa **Reembolsar al comprador**.                                    | "Si no hay entrega, el vendedor devuelve el dinero, o el comprador lo reclama por sí mismo a los 30 días."                                                                                              |
| 4:35–5:00 | `/health` y Swagger; el README con la tabla de pruebas.                                                                                    | "22 pruebas del contrato con 100 % de cobertura; 89 en el backend, 131 en el frontend y 6 e2e en un navegador real contra el contrato. Todo corre en CI."                                               |

## Si algo falla en vivo

| Síntoma                            | Respuesta                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Banner "MetaMask está en otra red" | Pulsa **Cambiar a Sepolia**: es una funcionalidad, aprovéchala para mostrarla.                                                  |
| Rechazas una firma                 | La UI dice "Rechazaste la operación… No se realizó ningún cargo": también es una funcionalidad.                                 |
| El backend tarda (Render dormido)  | Ya lo despertaste en la preparación. Si no, espera un minuto: la home muestra "No pudimos cargar las propiedades" sin romperse. |
| Pagaste pero el registro falló     | El modal ofrece **Reintentar registro**, que no vuelve a cobrar.                                                                |
| Sin ETH suficiente                 | El botón avisa "Saldo insuficiente" antes de abrir MetaMask. Usa precios con `DEMO_PRICE_SCALE`.                                |
