import { expect } from 'chai';
import { network } from 'hardhat';

const { ethers, networkHelpers } = await network.create();

const PRICE = ethers.parseEther('1');
const DELIVERY_PERIOD = 30 * 24 * 60 * 60;

describe('Escrow', () => {
  async function deployFixture() {
    const [seller, buyer, attacker, attackerAlt] = await ethers.getSigners();

    const escrow = await ethers.deployContract('Escrow');

    const propertyId = ethers.keccak256(
      ethers.toUtf8Bytes('property-1')
    );

    return {
      escrow,
      seller,
      buyer,
      attacker,
      attackerAlt,
      propertyId,
    };
  }

  /** Propiedad listada por el vendedor a PRICE. */
  async function listedFixture() {
    const ctx = await deployFixture();
    await ctx.escrow.connect(ctx.seller).list(ctx.propertyId, PRICE);
    return ctx;
  }

  /** Propiedad listada y con el depósito del comprador. */
  async function depositedFixture() {
    const ctx = await listedFixture();
    await ctx.escrow
      .connect(ctx.buyer)
      .deposit(ctx.propertyId, ctx.seller.address, { value: PRICE });
    return ctx;
  }

  describe('list', () => {
    it('el vendedor habilita la venta con un precio', async () => {
      const { escrow, seller, propertyId } = await deployFixture();

      await expect(escrow.connect(seller).list(propertyId, PRICE))
        .to.emit(escrow, 'Listed')
        .withArgs(propertyId, seller.address, PRICE);

      const listing = await escrow.listings(propertyId, seller.address);
      expect(listing.price).to.equal(PRICE);
      expect(listing.active).to.equal(true);
    });

    it('rechaza un precio de cero', async () => {
      const { escrow, seller, propertyId } = await deployFixture();

      await expect(
        escrow.connect(seller).list(propertyId, 0)
      ).to.be.revertedWith('El precio debe ser mayor a cero');
    });

    it('permite actualizar el precio mientras no haya depósito', async () => {
      const { escrow, seller, propertyId } = await listedFixture();
      const newPrice = ethers.parseEther('2');

      await escrow.connect(seller).list(propertyId, newPrice);

      expect(
        (await escrow.listings(propertyId, seller.address)).price
      ).to.equal(newPrice);
    });

    it('rechaza cambiar el precio con un depósito pendiente', async () => {
      const { escrow, seller, propertyId } = await depositedFixture();

      await expect(
        escrow.connect(seller).list(propertyId, ethers.parseEther('5'))
      ).to.be.revertedWith('Hay un deposito pendiente para esta propiedad');
    });

    it('rechaza volver a listar una propiedad vendida', async () => {
      const { escrow, seller, buyer, propertyId } = await depositedFixture();
      await escrow.connect(buyer).confirmDelivery(propertyId, seller.address);

      await expect(
        escrow.connect(seller).list(propertyId, PRICE)
      ).to.be.revertedWith('La propiedad ya fue vendida');
    });
  });

  describe('deposit', () => {
    it('rechaza depositar si el vendedor no habilitó la venta', async () => {
      const { escrow, seller, buyer, propertyId } = await deployFixture();

      await expect(
        escrow
          .connect(buyer)
          .deposit(propertyId, seller.address, { value: PRICE })
      ).to.be.revertedWith('La propiedad no esta habilitada para la venta');
    });

    it('rechaza un monto distinto al precio listado', async () => {
      const { escrow, seller, buyer, propertyId } = await listedFixture();

      await expect(
        escrow
          .connect(buyer)
          .deposit(propertyId, seller.address, { value: 1n })
      ).to.be.revertedWith('El monto debe ser igual al precio');

      await expect(
        escrow
          .connect(buyer)
          .deposit(propertyId, seller.address, { value: PRICE + 1n })
      ).to.be.revertedWith('El monto debe ser igual al precio');
    });

    it('rechaza un segundo depósito para la misma propiedad', async () => {
      const { escrow, seller, attacker, propertyId } = await depositedFixture();

      await expect(
        escrow
          .connect(attacker)
          .deposit(propertyId, seller.address, { value: PRICE })
      ).to.be.revertedWith('Ya existe un deposito para esta propiedad');
    });

    it('el comprador no puede ser también el vendedor', async () => {
      const { escrow, seller, propertyId } = await listedFixture();

      await expect(
        escrow
          .connect(seller)
          .deposit(propertyId, seller.address, { value: PRICE })
      ).to.be.revertedWith('El comprador no puede ser el vendedor');
    });

    it('un atacante con listado y depósito de 1 wei propios no bloquea la venta real', async () => {
      const {
        escrow,
        seller,
        buyer,
        attacker,
        attackerAlt,
        propertyId,
      } = await listedFixture();

      // El atacante lista la misma propiedad como "vendedor" y la "compra" por 1 wei.
      await escrow.connect(attackerAlt).list(propertyId, 1n);
      await escrow
        .connect(attacker)
        .deposit(propertyId, attackerAlt.address, { value: 1n });

      // No puede sobrescribir el listado del vendedor real...
      expect(
        (await escrow.listings(propertyId, seller.address)).price
      ).to.equal(PRICE);

      // ...y el comprador legítimo compra sin problema.
      await expect(
        escrow
          .connect(buyer)
          .deposit(propertyId, seller.address, { value: PRICE })
      )
        .to.emit(escrow, 'Deposited')
        .withArgs(propertyId, buyer.address, seller.address, PRICE);
    });
  });

  describe('confirmDelivery', () => {
    it('libera los fondos al vendedor y cierra el listado', async () => {
      const { escrow, seller, buyer, propertyId } = await depositedFixture();

      const tx = escrow.connect(buyer).confirmDelivery(propertyId, seller.address);

      await expect(tx)
        .to.emit(escrow, 'Released')
        .withArgs(propertyId, seller.address);
      await expect(tx).to.changeEtherBalances(
        ethers,
        [seller, escrow],
        [PRICE, -PRICE]
      );

      expect(
        (await escrow.listings(propertyId, seller.address)).active
      ).to.equal(false);
    });

    it('rechaza confirmar la entrega si no eres el comprador', async () => {
      const { escrow, seller, propertyId } = await depositedFixture();

      await expect(
        escrow.connect(seller).confirmDelivery(propertyId, seller.address)
      ).to.be.revertedWith('Solo el comprador puede confirmar la entrega');
    });

    it('rechaza un nuevo depósito después de completar la venta', async () => {
      const { escrow, seller, buyer, propertyId } = await depositedFixture();
      await escrow.connect(buyer).confirmDelivery(propertyId, seller.address);

      await expect(
        escrow
          .connect(buyer)
          .deposit(propertyId, seller.address, { value: PRICE })
      ).to.be.revertedWith('La propiedad no esta habilitada para la venta');
    });
  });

  describe('refund', () => {
    it('el vendedor reembolsa el depósito al comprador', async () => {
      const { escrow, seller, buyer, propertyId } = await depositedFixture();

      const tx = escrow.connect(seller).refund(propertyId, seller.address);

      await expect(tx)
        .to.emit(escrow, 'Refunded')
        .withArgs(propertyId, seller.address);
      await expect(tx).to.changeEtherBalances(
        ethers,
        [buyer, escrow],
        [PRICE, -PRICE]
      );
    });

    it('rechaza reembolsar si no eres el vendedor', async () => {
      const { escrow, seller, buyer, propertyId } = await depositedFixture();

      await expect(
        escrow.connect(buyer).refund(propertyId, seller.address)
      ).to.be.revertedWith('Solo el vendedor puede reembolsar');
    });

    it('rechaza confirmar la entrega después de un reembolso', async () => {
      const { escrow, seller, buyer, propertyId } = await depositedFixture();
      await escrow.connect(seller).refund(propertyId, seller.address);

      await expect(
        escrow.connect(buyer).confirmDelivery(propertyId, seller.address)
      ).to.be.revertedWith('No hay un deposito pendiente');
    });

    it('rechaza reembolsar después de confirmar la entrega', async () => {
      const { escrow, seller, buyer, propertyId } = await depositedFixture();
      await escrow.connect(buyer).confirmDelivery(propertyId, seller.address);

      await expect(
        escrow.connect(seller).refund(propertyId, seller.address)
      ).to.be.revertedWith('No hay un deposito pendiente');
    });

    it('permite un nuevo depósito después de un reembolso', async () => {
      const { escrow, seller, buyer, propertyId } = await depositedFixture();
      await escrow.connect(seller).refund(propertyId, seller.address);

      await expect(
        escrow
          .connect(buyer)
          .deposit(propertyId, seller.address, { value: PRICE })
      ).to.emit(escrow, 'Deposited');
    });
  });

  describe('claimRefund (plazo de entrega)', () => {
    it('rechaza reclamar antes de que venza el plazo', async () => {
      const { escrow, seller, buyer, propertyId } = await depositedFixture();
      await networkHelpers.time.increase(DELIVERY_PERIOD - 60);

      await expect(
        escrow.connect(buyer).claimRefund(propertyId, seller.address)
      ).to.be.revertedWith('El plazo de entrega no ha vencido');
    });

    it('vencido el plazo, el comprador recupera sus fondos', async () => {
      const { escrow, seller, buyer, propertyId } = await depositedFixture();
      await networkHelpers.time.increase(DELIVERY_PERIOD);

      const tx = escrow.connect(buyer).claimRefund(propertyId, seller.address);

      await expect(tx)
        .to.emit(escrow, 'Refunded')
        .withArgs(propertyId, seller.address);
      await expect(tx).to.changeEtherBalances(
        ethers,
        [buyer, escrow],
        [PRICE, -PRICE]
      );

      // Y el vendedor ya no puede cobrar después.
      await expect(
        escrow.connect(buyer).confirmDelivery(propertyId, seller.address)
      ).to.be.revertedWith('No hay un deposito pendiente');
    });

    it('solo el comprador puede reclamar', async () => {
      const { escrow, seller, attacker, propertyId } = await depositedFixture();
      await networkHelpers.time.increase(DELIVERY_PERIOD);

      await expect(
        escrow.connect(attacker).claimRefund(propertyId, seller.address)
      ).to.be.revertedWith('Solo el comprador puede reclamar el reembolso');
    });

    it('no se puede reclamar una venta ya confirmada', async () => {
      const { escrow, seller, buyer, propertyId } = await depositedFixture();
      await escrow.connect(buyer).confirmDelivery(propertyId, seller.address);
      await networkHelpers.time.increase(DELIVERY_PERIOD);

      await expect(
        escrow.connect(buyer).claimRefund(propertyId, seller.address)
      ).to.be.revertedWith('No hay un deposito pendiente');
    });
  });
});
