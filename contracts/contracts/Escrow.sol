// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Escrow
/// @notice Retiene el pago en ETH de una propiedad hasta que el comprador
/// confirma la entrega. Un vendedor puede reembolsar si la venta no se concreta.
contract Escrow {
    enum Status { NONE, AWAITING_DELIVERY, COMPLETE, REFUNDED }

    struct Deal {
        address buyer;
        address seller;
        uint256 amount;
        Status status;
    }

    /// @dev propertyId es el mismo UUID que usa el backend, convertido a uint256
    /// (keccak256 del string), no un contador propio del contrato.
    mapping(uint256 => Deal) public deals;

    event Deposited(uint256 indexed propertyId, address indexed buyer, address indexed seller, uint256 amount);

    function deposit(uint256 propertyId, address seller) external payable {
        require(msg.value > 0, "El deposito debe ser mayor a cero");
        require(deals[propertyId].status == Status.NONE, "Ya existe un deposito para esta propiedad");
        require(seller != msg.sender, "El comprador no puede ser el vendedor");

        deals[propertyId] = Deal({
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            status: Status.AWAITING_DELIVERY
        });

        emit Deposited(propertyId, msg.sender, seller, msg.value);
    }
}