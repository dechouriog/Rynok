import type { HardhatUserConfig } from 'hardhat/config';
import hardhatToolboxMochaEthersPlugin from '@nomicfoundation/hardhat-toolbox-mocha-ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: '0.8.24',
  networks: {
    ...(process.env.SEPOLIA_RPC_URL
      ? {
          sepolia: {
            type: 'http' as const,
            chainType: 'l1' as const,
            url: process.env.SEPOLIA_RPC_URL,
            accounts: process.env.PRIVATE_KEY
              ? [process.env.PRIVATE_KEY]
              : [],
          },
        }
      : {}),
  },
};

export default config;
