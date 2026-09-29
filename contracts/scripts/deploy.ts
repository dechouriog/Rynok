import { network } from 'hardhat';

async function main() {
  const { ethers } = await network.create();
  const escrow = await ethers.deployContract('Escrow');
  console.log(`Escrow desplegado en: ${await escrow.getAddress()}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});