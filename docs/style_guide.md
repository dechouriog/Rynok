# Guía de estilo de Rynok

Esta guía describe el sistema de diseño **tal como está implementado**:

- Los tokens viven en [`frontend/src/app/globals.css`](../frontend/src/app/globals.css) (bloque `@theme` de Tailwind v4).
- Los componentes están en [`frontend/src/components/ui`](../frontend/src/components/ui).

Si cambias un token, cámbialo allí y actualiza esta página.

> Nota histórica: hasta la Entrega 1 la paleta estaba en `tailwind.config.ts`, pero Tailwind v4 no lee ese archivo sin `@config`. Por eso ninguna clase `brand-*` generaba CSS: el logo salía negro y los íconos no tenían fondo. Los tokens se movieron a `@theme`.

## 1. Color

### Marca (azul)

Los valores 50, 100, 400, 500 y 600 son los originales de la marca. El resto completa la escala.

| Token       | Hex       | Uso                                                             |
| ----------- | --------- | --------------------------------------------------------------- |
| `brand-50`  | `#eff6ff` | Fondos suaves (hero, avisos informativos, pestaña activa)       |
| `brand-100` | `#dbeafe` | Selección de texto, rellenos de íconos                          |
| `brand-200` | `#bfdbfe` | Bordes de avisos de marca                                       |
| `brand-500` | `#2563eb` | Anillo de foco                                                  |
| `brand-600` | `#1d4ed8` | **Color primario**: botones, enlaces, logo (6.7:1 sobre blanco) |
| `brand-700` | `#1e40af` | Hover del primario, texto sobre `brand-50`                      |
| `brand-800` | `#1e3a8a` | Estado activo y texto de avisos                                 |

### Texto y superficies

| Token                                          | Hex                            | Contraste sobre blanco | Uso                                                          |
| ---------------------------------------------- | ------------------------------ | ---------------------- | ------------------------------------------------------------ |
| `ink`                                          | `#0f172a`                      | 17.9:1                 | Títulos y texto principal                                    |
| `ink-soft`                                     | `#334155`                      | 10.4:1                 | Párrafos                                                     |
| `ink-muted`                                    | `#64748b`                      | 4.8:1 (mínimo AA)      | Texto secundario. **No usar nada más claro para texto.**     |
| `surface` / `surface-muted` / `surface-sunken` | `#fff` / `#f8fafc` / `#f1f5f9` | —                      | Fondo, secciones alternas, skeletons y campos deshabilitados |
| `line` / `line-strong`                         | `#e2e8f0` / `#cbd5e1`          | —                      | Bordes de tarjetas y de controles                            |

### Estados

| Estado      | Fondo        | Texto/acento      | Uso                                              |
| ----------- | ------------ | ----------------- | ------------------------------------------------ |
| Éxito       | `success-50` | `success-600/700` | Compra habilitada, operación completada          |
| Advertencia | `warning-50` | `warning-600/700` | En escrow, red equivocada, precio desactualizado |
| Peligro     | `danger-50`  | `danger-600/700`  | Errores de formulario, eliminar, cancelar venta  |

Regla: el color nunca es la única señal. Los badges llevan ícono y texto, y los errores, ícono y mensaje.

## 2. Tipografía

- Familia: pila del sistema (`Inter` si está instalada; si no, `system-ui`, Segoe UI, Roboto…). No se usa `next/font/google`, así que el build no depende de la red.
- Escala:

| Rol                   | Clases                                                     |
| --------------------- | ---------------------------------------------------------- |
| Título de página (h1) | `text-2xl sm:text-3xl font-bold tracking-tight`            |
| Hero                  | `text-4xl sm:text-5xl font-extrabold tracking-tight`       |
| Sección (h2)          | `text-lg`–`text-2xl font-semibold`/`bold`                  |
| Cuerpo                | `text-base` (16 px), párrafos largos con `leading-relaxed` |
| Secundario            | `text-sm text-ink-muted`                                   |
| Etiqueta / badge      | `text-xs font-semibold`                                    |

- Direcciones y hashes: `font-mono`, acortados como `0x1234…abcd` con `shortenAddress`.
- Precios: `formatEth` → `2,5 ETH` (formato `es-CO`, hasta 6 decimales).

## 3. Espaciado y layout

- Escala base de Tailwind (múltiplos de 4 px). Valores habituales: `gap-2/3/4/6`, `p-4/5/6`, `mt-6/8/10` entre bloques.
- Contenedor: `mx-auto max-w-6xl px-4` (formularios: `max-w-3xl`).
- Medianiles de 16 px en móvil. Sin scroll horizontal a 360 px (lo comprueban `scripts/screenshots.mjs` y el e2e).
- Puntos de quiebre: móvil < 640 (`sm`), tablet ≥ 768 (`md`), escritorio ≥ 1024 (`lg`).

## 4. Radios y sombras

| Token             | Valor  | Uso                                   |
| ----------------- | ------ | ------------------------------------- |
| `rounded-control` | 10 px  | Botones, inputs, avisos               |
| `rounded-card`    | 16 px  | Tarjetas, modales, estados vacíos     |
| `rounded-full`    | —      | Badges, avatares de ícono             |
| `shadow-card`     | sutil  | Tarjetas y botones en reposo          |
| `shadow-raised`   | media  | Hover de tarjetas, toasts, menú móvil |
| `shadow-overlay`  | fuerte | Modales                               |

## 5. Componentes (`components/ui`)

| Componente                       | Notas de uso                                                                                                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                         | Variantes `primary` (una por vista), `secondary`, `outline`, `ghost`, `danger` y `success`. Tamaños `sm/md/lg` (alto mínimo 36 px). `loading` deshabilita el botón, muestra spinner y `aria-busy`.         |
| `ButtonLink`                     | Navegación con aspecto de botón. Nunca se usa un `<button>` para navegar.                                                                                                                                  |
| `Input`, `Textarea`, `Select`    | Siempre con `label` (o `hideLabel` si el contexto es obvio). `hint` y `error` se enlazan con `aria-describedby`; el error activa `aria-invalid` y `role="alert"`.                                          |
| `Card`, `CardHeader`, `CardBody` | Contenedor de borde y sombra.                                                                                                                                                                              |
| `Badge`                          | Tonos `neutral`, `brand`, `success`, `warning` y `danger`, con ícono. Para estados de propiedad y escrow se usan `PropertyStatusBadge` y `EscrowStatusBadge`.                                              |
| `Modal`                          | `<dialog>` nativo: atrapa el foco, cierra con Escape y devuelve el foco. `locked` impide cerrar mientras se firma una transacción. Toda acción destructiva o con dinero pasa por un modal de confirmación. |
| `Toast` (`useToast`)             | Confirmaciones y errores no bloqueantes. Los errores duran 9 s con `role="alert"`; el resto 5 s con `role="status"`.                                                                                       |
| `Skeleton`, `LoadingRegion`      | Mismas dimensiones que el contenido final (sin saltos). La región anuncia "Cargando…" una vez.                                                                                                             |
| `EmptyState`                     | Vacío o error: ícono, título, explicación y siguiente acción. Tono `danger` para errores.                                                                                                                  |
| `Tabs`                           | Patrón WAI-ARIA: flechas, Inicio y Fin, con un solo tab en el orden de tabulación.                                                                                                                         |

## 6. Estados de interacción

| Estado   | Tratamiento                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| Hover    | Un tono más oscuro (`brand-700`) o fondo `surface-sunken`                                                           |
| Focus    | Contorno de 2 px `brand-500` con 2 px de separación (`:focus-visible` global)                                       |
| Disabled | `opacity-60` y `cursor-not-allowed`. Si la razón no es obvia, `title` con la explicación (p. ej. "Disponible el …") |
| Loading  | Spinner en el botón con texto de progreso ("Confirma en MetaMask…") y skeletons en páginas                          |
| Error    | Borde `danger-600` y mensaje bajo el campo; en página, `EmptyState` con "Reintentar"                                |
| Vacío    | `EmptyState` con la acción que resuelve el vacío ("Publicar propiedad", "Explorar")                                 |

## 7. Iconografía

- Solo `lucide-react`. Tamaño `h-4 w-4` en texto y botones, `h-5 w-5` en tarjetas y `h-6+` en estados vacíos.
- Los íconos decorativos llevan `aria-hidden`. Los botones que solo tienen ícono llevan `aria-label` (por ejemplo, "Cerrar", "Abrir menú").

## 8. Movimiento

- Animaciones cortas (150–200 ms): `animate-fade-in`, `animate-slide-up` y `animate-shimmer` para skeletons.
- `prefers-reduced-motion: reduce` desactiva animaciones y el scroll suave.

## 9. Tono de los textos (español)

- Tuteo, frases cortas, voz activa: "Conecta tu wallet", "Habilita la compra".
- Explicar qué pasó y qué hacer: "Rechazaste la operación en MetaMask. No se realizó ningún cargo."
- Sin jerga innecesaria. Se usan "wallet", "ETH", "escrow" y "contrato" porque el público las conoce; nunca "revert", "nonce" ni "calldata".
- En botones que mueven dinero, el monto va en el propio botón: "Depositar 2,5 ETH".
- Errores del contrato traducidos en [`lib/blockchain.ts`](../frontend/src/lib/blockchain.ts) (`describeTxError`).

## 10. Accesibilidad (checklist aplicado)

- [x] Contraste AA en texto (mínimo `ink-muted`, 4.8:1).
- [x] Foco visible global y "Saltar al contenido".
- [x] Etiquetas en todos los campos y errores enlazados.
- [x] Navegación por teclado en menú móvil (Escape), pestañas (flechas) y modales (Escape, foco atrapado).
- [x] `alt` descriptivo en imágenes ("Foto de …").
- [x] `aria-current="page"` en la navegación y `aria-live` en resultados y toasts.
- [x] `lang="es"` y `prefers-reduced-motion`.
- [ ] Pendiente: auditoría con lector de pantalla real (NVDA/VoiceOver), que no se hizo en esta iteración.
