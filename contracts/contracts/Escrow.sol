// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Escrow
/// @notice Retiene el pago en ETH de una propiedad hasta que el comprador
/// confirma la entrega. El vendedor recibe los fondos únicamente después
/// de que el comprador confirme la entrega.
contract Escrow is ReentrancyGuard {
    enum Status {
        NONE,
        AWAITING_DELIVERY,
        COMPLETE,
        REFUNDED
    }

    struct Deal {
        address buyer;
        address seller;
        uint256 amount;
        Status status;
    }

    /// @dev propertyId es el mismo UUID que usa el backend, convertido a uint256
    /// (keccak256 del string), no un contador propio del contrato.
    mapping(uint256 => Deal) public deals;

    event Deposited(
        uint256 indexed propertyId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );

    event Released(uint256 indexed propertyId);

    /// @notice Deposita ETH para una propiedad.
    /// @param propertyId Identificador único de la propiedad.
    /// @param seller Dirección del vendedor.
    function deposit(
        uint256 propertyId,
        address seller
    ) external payable {
        require(
            msg.value > 0,
            "El deposito debe ser mayor a cero"
        );

        require(
            deals[propertyId].status == Status.NONE,
            "Ya existe un deposito para esta propiedad"
        );

        require(
            seller != msg.sender,
            "El comprador no puede ser el vendedor"
        );

        deals[propertyId] = Deal({
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
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
    /// @dev Libera los fondos al vendedor.
    /// @param propertyId Identificador único de la propiedad.
    function confirmDelivery(
        uint256 propertyId
    ) external nonReentrant {
        Deal storage deal = deals[propertyId];

        require(
            deal.status == Status.AWAITING_DELIVERY,
            "No hay un deposito pendiente"
        );

        require(
            msg.sender == deal.buyer,
            "Solo el comprador puede confirmar la entrega"
        );

        deal.status = Status.COMPLETE;

        (bool sent, ) = deal.seller.call{value: deal.amount}("");

        require(
            sent,
            "Transferencia al vendedor fallida"
        );

        emit Released(propertyId);
    }
}