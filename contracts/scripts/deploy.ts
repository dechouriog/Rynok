import { network } from 'hardhat';

async function main() {
  const { ethers } = await network.create();
  const escrow = await ethers.deployContract('Escrow');
  await escrow.waitForDeployment();
  const address = await escrow.getAddress();
  const { chainId } = await ethers.provider.getNetwork();

  console.log(`Escrow desplegado en: ${address} (chainId ${chainId})`);
  console.log('\nActualiza las variables de entorno:');
  console.log(`  frontend/.env.local -> NEXT_PUBLIC_ESCROW_ADDRESS=${address}`);
  console.log(`  backend/.env        -> ESCROW_CONTRACT_ADDRESS=${address}`);
  console.log('  backend/.env        -> ESCROW_RPC_URL=<el mismo RPC usado para desplegar>');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
