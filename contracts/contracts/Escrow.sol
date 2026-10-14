// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Escrow
/// @notice Retiene el pago en ETH de una propiedad hasta que el comprador
/// confirma la entrega. El vendedor habilita la venta fijando el precio
/// on-chain (`list`) y puede reembolsar el pago si la venta no se concreta.
/// Si la entrega no se confirma dentro de DELIVERY_PERIOD, el comprador puede
/// recuperar sus fondos (`claimRefund`).
/// @dev Listados y depósitos se indexan por (propertyId, vendedor). Así nadie
/// puede listar, comprar ni bloquear una propiedad en nombre de otro vendedor:
/// un atacante solo puede crear listados y depósitos asociados a sí mismo.
contract Escrow is ReentrancyGuard {
    /// @notice Plazo que tiene el vendedor para entregar antes de que el
    /// comprador pueda reclamar su reembolso.
    uint256 public constant DELIVERY_PERIOD = 30 days;

    enum Status {
        NONE,
        AWAITING_DELIVERY,
        COMPLETE,
        REFUNDED
    }

    struct Listing {
        uint256 price;
        bool active;
    }

    struct Deal {
        address buyer;
        uint256 amount;
        uint256 depositedAt;
        Status status;
    }

    /// @dev propertyId es el mismo UUID que usa el backend, convertido a uint256
    /// (keccak256 del string), no un contador propio del contrato.
    mapping(uint256 => mapping(address => Listing)) public listings;
    mapping(uint256 => mapping(address => Deal)) public deals;

    event Listed(
        uint256 indexed propertyId,
        address indexed seller,
        uint256 price
    );

    event Deposited(
        uint256 indexed propertyId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );

    event Released(
        uint256 indexed propertyId,
        address indexed seller
    );

    event Refunded(
        uint256 indexed propertyId,
        address indexed seller
    );

    /// @notice El vendedor habilita (o actualiza el precio de) la venta.
    /// @param propertyId Identificador único de la propiedad.
    /// @param price Precio exacto en wei que debe depositar el comprador.
    function list(uint256 propertyId, uint256 price) external {
        require(price > 0, "El precio debe ser mayor a cero");

        Status status = deals[propertyId][msg.sender].status;
        require(
            status != Status.AWAITING_DELIVERY,
            "Hay un deposito pendiente para esta propiedad"
        );
        require(
            status != Status.COMPLETE,
            "La propiedad ya fue vendida"
        );

        listings[propertyId][msg.sender] = Listing({
            price: price,
            active: true
        });

        emit Listed(propertyId, msg.sender, price);
    }

    /// @notice Deposita el precio exacto de una propiedad listada.
    /// @param propertyId Identificador único de la propiedad.
    /// @param seller Vendedor que listó la propiedad.
    function deposit(
        uint256 propertyId,
        address seller
    ) external payable {
        Listing memory listing = listings[propertyId][seller];

        require(
            listing.active,
            "La propiedad no esta habilitada para la venta"
        );

        require(
            msg.value == listing.price,
            "El monto debe ser igual al precio"
        );

        require(
            seller != msg.sender,
            "El comprador no puede ser el vendedor"
        );

        // Tras un reembolso la propiedad vuelve a estar a la venta.
        Status current = deals[propertyId][seller].status;
        require(
            current == Status.NONE || current == Status.REFUNDED,
            "Ya existe un deposito para esta propiedad"
        );

        deals[propertyId][seller] = Deal({
            buyer: msg.sender,
            amount: msg.value,
            depositedAt: block.timestamp,
            status: Status.AWAITING_DELIVERY
        });

        emit Deposited(
            propertyId,
            msg.sender,
            seller,
            msg.value
        );
    }

    /// @notice El comprador confirma que recibió la propiedad.
    /// @dev Libera los fondos al vendedor y cierra el listado.
    function confirmDelivery(
        uint256 propertyId,
        address seller
    ) external nonReentrant {
        Deal storage deal = _pendingDeal(propertyId, seller);

        require(
            msg.sender == deal.buyer,
            "Solo el comprador puede confirmar la entrega"
        );

        deal.status = Status.COMPLETE;
        listings[propertyId][seller].active = false;

        _send(seller, deal.amount, "Transferencia al vendedor fallida");

        emit Released(propertyId, seller);
    }

    /// @notice El vendedor devuelve los fondos al comprador.
    function refund(
        uint256 propertyId,
        address seller
    ) external nonReentrant {
        Deal storage deal = _pendingDeal(propertyId, seller);

        require(
            msg.sender == seller,
            "Solo el vendedor puede reembolsar"
        );

        deal.status = Status.REFUNDED;

        _send(deal.buyer, deal.amount, "Reembolso fallido");

        emit Refunded(propertyId, seller);
    }

    /// @notice Vencido el plazo de entrega, el comprador recupera sus fondos.
    function claimRefund(
        uint256 propertyId,
        address seller
    ) external nonReentrant {
        Deal storage deal = _pendingDeal(propertyId, seller);

        require(
            msg.sender == deal.buyer,
            "Solo el comprador puede reclamar el reembolso"
        );

        require(
            block.timestamp >= deal.depositedAt + DELIVERY_PERIOD,
            "El plazo de entrega no ha vencido"
        );

        deal.status = Status.REFUNDED;

        _send(deal.buyer, deal.amount, "Reembolso fallido");

        emit Refunded(propertyId, seller);
    }

    function _pendingDeal(
        uint256 propertyId,
        address seller
    ) private view returns (Deal storage deal) {
        deal = deals[propertyId][seller];
        require(
            deal.status == Status.AWAITING_DELIVERY,
            "No hay un deposito pendiente"
        );
    }

    function _send(
        address to,
        uint256 amount,
        string memory errorMessage
    ) private {
        (bool sent, ) = to.call{value: amount}("");
        require(sent, errorMessage);
    }
}
