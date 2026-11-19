# Diagramas del sistema

Diagramas en Mermaid (GitHub los renderiza), reconciliados con el código actual.

## 1. Casos de uso

```mermaid
flowchart LR
  V(("Vendedor"))
  C(("Comprador"))
  T(("Visitante"))
  SC[["Escrow.sol"]]

  subgraph Rynok
    UC1["Conectar wallet (nonce + firma)"]
    UC2["Publicar / editar / eliminar propiedad<br/>(con foto subida)"]
    UC3["Habilitar compra / actualizar precio on-chain"]
    UC4["Explorar, filtrar y ordenar"]
    UC5["Ver detalle"]
    UC6["Comprar (depositar en escrow)"]
    UC7["Confirmar entrega"]
    UC8["Reclamar reembolso (30 días)"]
    UC9["Reembolsar al comprador"]
    UC10["Ver compras y ventas"]
  end

  T --> UC4 & UC5
  V --> UC1 & UC2 & UC3 & UC9 & UC10
  C --> UC1 & UC6 & UC7 & UC8 & UC10
  UC3 & UC6 & UC7 & UC8 & UC9 -.-> SC
```

## 2. Componentes

```mermaid
flowchart TB
  subgraph Frontend["frontend/ (Next.js)"]
    Pages["app/* (páginas)"]
    UI["components/ui (sistema de diseño)"]
    Esc["components/escrow<br/>PurchasePanel · OwnerPanel · TransactionCard"]
    Form["PropertyForm + ImageInput"]
    WC["context/WalletContext"]
    ApiLib["lib/api.ts"]
    Chain["lib/blockchain.ts"]
    Pages --> UI & Esc & Form & WC
    Esc --> ApiLib & Chain & WC
    Form --> ApiLib
    WC --> ApiLib & Chain
  end
  subgraph Backend["backend/ (NestJS)"]
    Auth["AuthModule<br/>nonce · connect · guard"]
    Prop["PropertyModule"]
    Up["UploadsModule"]
    EscM["EscrowModule<br/>EscrowService · EscrowChainVerifier"]
    Health["HealthController"]
    Prop --> Auth & Up
    EscM --> Auth
    Health --> EscM
  end
  DB[("PostgreSQL")]
  SC[["Escrow.sol"]]
  ApiLib -- HTTP --> Auth & Prop & Up & EscM & Health
  Chain -- "MetaMask / RPC" --> SC
  EscM -- RPC --> SC
  Auth & Prop & EscM --> DB
```

## 3. Modelo de datos (ERD)

```mermaid
erDiagram
  USERS ||--o{ PROPERTIES : publica
  PROPERTIES ||--o{ ESCROW_TRANSACTIONS : "propertyId (sin FK)"

  USERS {
    uuid id PK
    varchar walletAddress UK "minúsculas"
    varchar displayName "nullable"
    timestamp createdAt
  }
  PROPERTIES {
    uuid id PK
    varchar title
    text description
    varchar location
    numeric priceEth "18,6"
    varchar imageUrl "nullable: URL externa o /uploads/..."
    simple_enum status "AVAILABLE | IN_ESCROW | SOLD"
    uuid ownerId FK
    timestamp createdAt
    timestamp updatedAt
  }
  ESCROW_TRANSACTIONS {
    uuid id PK
    uuid propertyId "relación sin FK: el historial sobrevive a la propiedad"
    varchar buyerWallet
    varchar sellerWallet
    numeric amountEth "18,6"
    varchar contractAddress
    varchar depositTxHash UK
    varchar releaseTxHash "nullable"
    varchar refundTxHash "nullable"
    simple_enum status "AWAITING_DELIVERY | COMPLETE | REFUNDED"
    timestamp createdAt
    timestamp updatedAt
  }
```

Estado en cadena (`Escrow.sol`), indexado por `(uint256 propertyId, address seller)`:

- `listings`: `{ price, active }`
- `deals`: `{ buyer, amount, depositedAt, status: NONE | AWAITING_DELIVERY | COMPLETE | REFUNDED }`

## 4. Secuencia: inicio de sesión

```mermaid
sequenceDiagram
  actor U as Usuario
  participant W as Web
  participant M as MetaMask
  participant A as API
  W->>M: eth_requestAccounts
  W->>A: POST /auth/nonce {walletAddress}
  A-->>W: message (nonce, válido 5 min)
  W->>M: personal_sign(message)
  W->>A: POST /auth/connect {walletAddress, signature, message}
  A->>A: consume el nonce y verifica la firma
  A-->>W: JWT
```

## 5. Secuencia: compra protegida

```mermaid
sequenceDiagram
  actor C as Comprador
  participant W as Web
  participant M as MetaMask
  participant E as Escrow.sol
  participant A as API
  participant D as Postgres

  W->>A: GET /properties/:id
  A-->>W: status=AVAILABLE, dueño, precio
  W->>E: listings(id, dueño) (lectura por RPC)
  E-->>W: price, active
  W->>W: ¿activo y precio = publicado?
  C->>W: Comprar → Confirmar
  W->>M: deposit(id, dueño) {value: precio}
  M->>E: tx → Deposited(id, buyer, seller, amount)
  W->>A: POST /escrow/deposit {propertyId, amountEth, contractAddress, depositTxHash} + JWT
  A->>E: getTransactionReceipt
  A->>A: comprador = JWT, vendedor = dueño, monto = precio, hash no repetido
  A->>D: EscrowTransaction(AWAITING_DELIVERY), property=IN_ESCROW
  A-->>W: 201 → /escrow
```

## 6. Secuencia: liquidación

```mermaid
sequenceDiagram
  actor C as Comprador
  actor V as Vendedor
  participant E as Escrow.sol
  participant A as API
  alt Entrega confirmada
    C->>E: confirmDelivery(id, vendedor)
    E-->>V: transfiere el monto
    C->>A: POST /escrow/:id/confirm {releaseTxHash}
    A->>A: verifica Released → COMPLETE / SOLD
  else El vendedor reembolsa
    V->>E: refund(id, vendedor)
    E-->>C: devuelve el monto
    V->>A: POST /escrow/:id/refund {refundTxHash}
    A->>A: verifica Refunded → REFUNDED / AVAILABLE
  else Pasaron 30 días sin entrega
    C->>E: claimRefund(id, vendedor)
    E-->>C: devuelve el monto
    C->>A: POST /escrow/:id/refund {refundTxHash}
  end
```
