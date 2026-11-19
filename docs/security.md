# Seguridad de Rynok

El modelo de seguridad **del contrato** (listados por `(propiedad, vendedor)`, ataque de 1 wei, plazo de 30 días, reentrancy) está en [escrow.md](./escrow.md). Este documento cubre el resto del sistema: la API, el frontend y la operación, con el código y la prueba que respaldan cada decisión.

## 1. Activos y actores

| Activo                                                  | Dónde vive                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| ETH del comprador durante la operación                  | `Escrow.sol` (nadie más puede moverlo)                             |
| Estado de la propiedad (disponible, en escrow, vendida) | Postgres, alimentado **solo** por eventos verificados del contrato |
| Sesión del usuario                                      | JWT en `sessionStorage`                                            |
| Imágenes subidas                                        | `UPLOAD_DIR` del backend                                           |

Actores hostiles considerados: un comprador o vendedor malicioso, un tercero que conoce los ids (son públicos) y un **cliente HTTP manipulado** que llama a la API sin pasar por la UI.

## 2. API

| #   | Amenaza                                                                                | Mitigación                                                                                                                                        | Dónde                             | Prueba                                                                     |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------- |
| A1  | Registrar compras, liberaciones o reembolsos falsos enviando un hash inventado         | El backend lee el recibo y exige el evento esperado del contrato configurado, con propiedad, comprador, vendedor y monto correctos                | `EscrowChainVerifier.assertEvent` | `escrow-chain.verifier.spec.ts`; e2e de Playwright con verificación activa |
| A2  | **Despliegue sin RPC**: antes, sin `ESCROW_RPC_URL` el backend aceptaba cualquier hash | Fail-closed: con `NODE_ENV=production` responde 503 si no puede verificar. En desarrollo avisa en el log y en `/health`                           | `EscrowChainVerifier`             | `hardening.spec.ts` ("en producción rechaza todo")                         |
| A3  | Registrar dos veces el mismo depósito                                                  | `depositTxHash` único y 409                                                                                                                       | entidad + `recordDeposit`         | `escrow.service.spec.ts`, `hardening.e2e-spec.ts`                          |
| A4  | Depósito por otro monto, de otro comprador o a otro vendedor                           | Comprador = wallet del JWT, vendedor = dueño en la base y monto = precio publicado; nunca se toman del cliente                                    | `EscrowService.recordDeposit`     | `escrow.service.spec.ts`                                                   |
| A5  | Replay de firma de login                                                               | Nonce aleatorio de un solo uso que caduca en 5 minutos                                                                                            | `AuthService`                     | `auth.service.spec.ts`                                                     |
| A6  | Fuerza bruta o abuso                                                                   | Rate limiting: 120 peticiones por minuto por IP y 10 por minuto en `nonce` y `connect` (429). Con `trust proxy`, la IP real detrás de Render      | `app.module.ts`, `app.setup.ts`   | `hardening.e2e-spec.ts`                                                    |
| A7  | Secreto JWT por defecto (`'dev-secret'`)                                               | Obligatorio en producción; en desarrollo, aleatorio por proceso                                                                                   | `resolveJwtSecret`                | `hardening.spec.ts`                                                        |
| A8  | Inyección de campos (`owner`, `status`)                                                | `ValidationPipe` con `whitelist` + `forbidNonWhitelisted`; DTOs con longitudes y patrones                                                         | `app.setup.ts`                    | `hardening.e2e-spec.ts`                                                    |
| A9  | Fuga de detalles internos                                                              | Filtro global: los 5xx dan un mensaje genérico y el detalle va al log; formato `{statusCode, error, message, path, timestamp}`                    | `AllExceptionsFilter`             | `hardening.spec.ts`                                                        |
| A10 | Cabeceras inseguras o CORS abierto (antes `enableCors()` sin restricción)              | `helmet()` y CORS limitado a `CORS_ORIGINS`. `Cross-Origin-Resource-Policy: cross-origin` para que la web en Vercel cargue las imágenes de la API | `app.setup.ts`                    | `hardening.e2e-spec.ts`                                                    |
| A11 | Archivos maliciosos disfrazados de imagen                                              | Tipo detectado por bytes, nombre aleatorio, máx. 5 MB, `nosniff`                                                                                  | `UploadsService`                  | `uploads.service.spec.ts`, `uploads.e2e-spec.ts`                           |
| A12 | Editar o eliminar con fondos en escrow                                                 | 409                                                                                                                                               | `PropertyService`                 | `property.service.spec.ts`, `hardening.e2e-spec.ts`                        |

## 3. Frontend

- El botón de compra solo aparece si el contrato, leído desde el navegador (por RPC incluso sin MetaMask), confirma que el vendedor habilitó la venta **al precio publicado**.
- Toda acción con dinero o destructiva pasa por un modal de confirmación que muestra el monto.
- Red equivocada: banner global y cambio con `wallet_switchEthereumChain`, o `wallet_addEthereumChain` si MetaMask no la conoce.
- Si cambias de cuenta en MetaMask, se cierra la sesión de la cuenta anterior.
- Si el JWT expira, se detecta por su `exp` y, ante un 401, se pide una firma nueva y se reintenta la operación.
- Si el pago entra al contrato pero el backend no responde, la UI conserva el hash y permite reintentar el registro **sin volver a pagar**.

## 4. Secretos

- `.gitignore` excluye `.env`, `.env.*` (salvo los `.example`), `*.pem` y `*.key`.
- Las claves privadas que aparecen en las pruebas e2e son las **cuentas públicas de Hardhat**, marcadas como tales.
- `JWT_SECRET` lo genera Render (`generateValue`); `ESCROW_RPC_URL` y `CORS_ORIGINS` se piden al crear el Blueprint y no se versionan.

## 5. Limitaciones conocidas

1. **Sin sistema de disputas** (ver [escrow.md](./escrow.md)): si el comprador no confirma una entrega real, puede recuperar el dinero a los 30 días.
2. **Nonces en memoria**: el backend debe correr como una sola instancia. Con varias instancias habría que moverlos a la base o a Redis.
3. **Un solo RPC**: un proveedor malicioso podría mentir sobre los recibos. En producción convendrían varios proveedores o un nodo propio.
4. **Disco efímero en Render free**: las imágenes subidas se pierden al redesplegar.
5. **`synchronize: true`** por defecto (`DB_SYNCHRONIZE`); en producción real se usarían migraciones.
6. **JWT en `sessionStorage`**: accesible a JavaScript. La alternativa es una cookie `httpOnly` con protección CSRF.
7. **Eliminar una propiedad no retira su listado del contrato** (el contrato no tiene `unlist`). La API no registra pagos de propiedades eliminadas, pero un depósito directo al contrato sería posible; el vendedor puede devolverlo con `refund`.
8. Sin auditoría externa ni análisis estático (Slither/Mythril) del contrato.
