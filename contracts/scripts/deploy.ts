import { ethers } from 'hardhat';

async function main() {
  const Escrow = await ethers.getContractFactory('Escrow');
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();
  console.log(`Escrow desplegado en: ${await escrow.getAddress()}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});