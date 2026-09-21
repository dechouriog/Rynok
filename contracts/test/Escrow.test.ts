import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Escrow', () => {
  async function deployFixture() {
    const [seller, buyer] = await ethers.getSigners();

    const Escrow = await ethers.getContractFactory('Escrow');
    const escrow = await Escrow.deploy();

    const propertyId = ethers.keccak256(
      ethers.toUtf8Bytes('property-1')
    );

    return {
      escrow,
      seller,
      buyer,
      propertyId,
    };
  }

  it('permite depositar y luego confirmar la entrega, liberando fondos al vendedor', async () => {
    const {
      escrow,
      seller,
      buyer,
      propertyId,
    } = await deployFixture();

    const amount = ethers.parseEther('1');

    await expect(
      escrow
        .connect(buyer)
        .deposit(propertyId, seller.address, {
          value: amount,
        })
    )
      .to.emit(escrow, 'Deposited')
      .withArgs(
        propertyId,
        buyer.address,
        seller.address,
        amount
      );

    const sellerBalanceBefore =
      await ethers.provider.getBalance(seller.address);

    await expect(
      escrow.connect(buyer).confirmDelivery(propertyId)
    )
      .to.emit(escrow, 'Released')
      .withArgs(propertyId);

    const sellerBalanceAfter =
      await ethers.provider.getBalance(seller.address);

    expect(
      sellerBalanceAfter - sellerBalanceBefore
    ).to.equal(amount);
  });

  it('rechaza un segundo depósito para la misma propiedad', async () => {
    const {
      escrow,
      seller,
      buyer,
      propertyId,
    } = await deployFixture();

    await escrow
      .connect(buyer)
      .deposit(propertyId, seller.address, {
        value: ethers.parseEther('1'),
      });

    await expect(
      escrow
        .connect(buyer)
        .deposit(propertyId, seller.address, {
          value: ethers.parseEther('1'),
        })
    ).to.be.revertedWith(
      'Ya existe un deposito para esta propiedad'
    );
  });

  it('rechaza confirmar la entrega si no eres el comprador', async () => {
    const {
      escrow,
      seller,
      buyer,
      propertyId,
    } = await deployFixture();

    await escrow
      .connect(buyer)
      .deposit(propertyId, seller.address, {
        value: ethers.parseEther('1'),
      });

    await expect(
      escrow.connect(seller).confirmDelivery(propertyId)
    ).to.be.revertedWith(
      'Solo el comprador puede confirmar la entrega'
    );
  });

  it('rechaza reembolsar si no eres el vendedor', async () => {
    const {
      escrow,
      seller,
      buyer,
      propertyId,
    } = await deployFixture();

    await escrow
      .connect(buyer)
      .deposit(propertyId, seller.address, {
        value: ethers.parseEther('1'),
      });

    await expect(
      escrow.connect(buyer).refund(propertyId)
    ).to.be.revertedWith(
      'Solo el vendedor puede reembolsar'
    );
  });

  it('el comprador no puede ser también el vendedor', async () => {
    const {
      escrow,
      buyer,
      propertyId,
    } = await deployFixture();

    await expect(
      escrow
        .connect(buyer)
        .deposit(propertyId, buyer.address, {
          value: ethers.parseEther('1'),
        })
    ).to.be.revertedWith(
      'El comprador no puede ser el vendedor'
    );
  });

  it('permite al vendedor reembolsar el depósito al comprador', async () => {
    const {
      escrow,
      seller,
      buyer,
      propertyId,
    } = await deployFixture();

    const amount = ethers.parseEther('1');

    await escrow
      .connect(buyer)
      .deposit(propertyId, seller.address, {
        value: amount,
      });

    const buyerBalanceBefore =
      await ethers.provider.getBalance(buyer.address);

    await expect(
      escrow.connect(seller).refund(propertyId)
    )
      .to.emit(escrow, 'Refunded')
      .withArgs(propertyId);

    const buyerBalanceAfter =
      await ethers.provider.getBalance(buyer.address);

    expect(
      buyerBalanceAfter - buyerBalanceBefore
    ).to.equal(amount);
  });

  it('rechaza confirmar la entrega después de un reembolso', async () => {
    const {
      escrow,
      seller,
      buyer,
      propertyId,
    } = await deployFixture();

    await escrow
      .connect(buyer)
      .deposit(propertyId, seller.address, {
        value: ethers.parseEther('1'),
      });

    await escrow
      .connect(seller)
      .refund(propertyId);

    await expect(
      escrow.connect(buyer).confirmDelivery(propertyId)
    ).to.be.revertedWith(
      'No hay un deposito pendiente'
    );
  });

  it('rechaza reembolsar después de confirmar la entrega', async () => {
    const {
      escrow,
      seller,
      buyer,
      propertyId,
    } = await deployFixture();

    await escrow
      .connect(buyer)
      .deposit(propertyId, seller.address, {
        value: ethers.parseEther('1'),
      });

    await escrow
      .connect(buyer)
      .confirmDelivery(propertyId);

    await expect(
      escrow.connect(seller).refund(propertyId)
    ).to.be.revertedWith(
      'No hay un deposito pendiente'
    );
  });
});