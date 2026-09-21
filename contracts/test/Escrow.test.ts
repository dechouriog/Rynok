import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Escrow', () => {
  async function deployFixture() {
    const [seller, buyer] = await ethers.getSigners();
    const Escrow = await ethers.getContractFactory('Escrow');
    const escrow = await Escrow.deploy();
    const propertyId = ethers.keccak256(ethers.toUtf8Bytes('property-1'));
    return { escrow, seller, buyer, propertyId };
  }

  it('permite depositar y luego confirmar la entrega, liberando fondos al vendedor', async () => {
    const { escrow, seller, buyer, propertyId } = await deployFixture();
    const amount = ethers.parseEther('1');

    await expect(escrow.connect(buyer).deposit(propertyId, seller.address, { value: amount }))
      .to.emit(escrow, 'Deposited')
      .withArgs(propertyId, buyer.address, seller.address, amount);

    const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);

    await expect(escrow.connect(buyer).confirmDelivery(propertyId))
      .to.emit(escrow, 'Released')
      .withArgs(propertyId);

    const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
    expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(amount);
  });
});